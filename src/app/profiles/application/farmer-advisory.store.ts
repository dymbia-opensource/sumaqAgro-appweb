import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { forkJoin, Subscription, switchMap } from 'rxjs';
import { FieldManagementStore } from '../../field-management/application/field-management.store';
import { DemoSessionService } from '../../shared/application/demo-session.service';
import { DemoUser } from '../../shared/domain/model/demo-user';
import { PlotAdvisorAssignment } from '../domain/model/entities/plot-advisor-assignment';
import { TechnicalAdvisor } from '../domain/model/entities/technical-advisor.entity';
import { ProfilesApi } from '../infrastructure/profiles-api';
import { PlotAdvisorAssignmentsApi } from '../infrastructure/plot-advisor-assignments.api';

/**
 * Resolves and changes the farmer's demo advisor per owned plot.
 * @remarks
 * This does not activate a plan. IAM and the backend must eventually validate
 * consent and ownership. Writes preserve previous assignments in the same resource.
 */
@Injectable({ providedIn: 'root' })
export class FarmerAdvisoryStore {
  private readonly profiles = inject(ProfilesApi);
  private readonly api = inject(PlotAdvisorAssignmentsApi);
  private readonly fields = inject(FieldManagementStore);
  private readonly session = inject(DemoSessionService);
  private readonly participant = signal<DemoUser | null>(null);
  private readonly advisorState = signal<TechnicalAdvisor[]>([]);
  private readonly assignmentState = signal<PlotAdvisorAssignment[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly ready = signal(false);
  private requests = new Subscription();
  private revision = 0;
  private readonly current = computed(
    () =>
      this.participant() === this.session.activeUser() &&
      this.session.activeUser()?.experience === 'FARMER',
  );
  readonly advisors = computed(() => (this.current() ? this.advisorState() : []));
  readonly assignments = computed(() =>
    this.current()
      ? this.assignmentState().filter(
          (item) => this.owns(item.plotId) && item.producerUserId === this.session.activeUser()?.id,
        )
      : [],
  );
  readonly loading = computed(
    () => this.current() && (this.loadingState() || this.fields.plotsLoading()),
  );
  readonly saving = computed(() => this.current() && this.savingState());
  readonly error = computed(() => (this.current() ? this.errorState() : null));

  constructor() {
    effect(() => {
      this.session.activeUser();
      untracked(() => this.reload());
    });
    inject(DestroyRef).onDestroy(() => this.requests.unsubscribe());
  }

  /** Reloads catalogue and assignments, cancelling requests from the previous participant. */
  reload(): void {
    this.requests.unsubscribe();
    this.requests = new Subscription();
    const revision = ++this.revision;
    const user = this.session.activeUser();
    this.participant.set(user);
    this.advisorState.set([]);
    this.assignmentState.set([]);
    this.errorState.set(null);
    this.loadingState.set(false);
    this.savingState.set(false);
    this.ready.set(false);
    if (user?.experience !== 'FARMER') return;
    this.loadingState.set(true);
    this.requests.add(
      forkJoin({
        advisors: this.profiles.getAvailableAdvisors(),
        assignments: this.api.getByProducer(user.id),
      }).subscribe({
        next: ({ advisors, assignments }) => {
          if (!this.isCurrent(revision)) return;
          this.advisorState.set(advisors);
          this.assignmentState.set(assignments);
          this.loadingState.set(false);
          this.ready.set(true);
        },
        error: () => {
          if (this.isCurrent(revision)) {
            this.loadingState.set(false);
            this.errorState.set('profiles.advisory.errors.load');
          }
        },
      }),
    );
  }

  /** Returns only the assignment belonging to the current producer and plot. */
  assignmentFor(plotId: number): PlotAdvisorAssignment | null {
    return this.assignments().find((item) => item.plotId === plotId) ?? null;
  }

  /** Returns the professional linked by account ID, never by a coincident record ID. */
  advisorFor(plotId: number): TechnicalAdvisor | null {
    const assignment = this.assignmentFor(plotId);
    return (
      this.advisors().find(
        (item) =>
          item.userId === (assignment?.status === 'ACTIVE' ? assignment.advisorUserId : undefined),
      ) ?? null
    );
  }

  /** Indicates whether this loaded producer can assign the referenced plot. */
  canAssign(plotId: number): boolean {
    return this.current() && this.ready() && !this.loading() && !this.saving() && this.owns(plotId);
  }

  /**
   * Changes responsibility after the view explicitly confirms the selected professional.
   * @param plotId - Plot owned by the active producer.
   * @param advisorUserId - Account reference of a selectable professional.
   * @param onSaved - Called only after server confirmation in the same session.
   */
  assign(plotId: number, advisorUserId: number, onSaved: () => void): void {
    if (this.saving()) return;
    if (!this.canAssign(plotId) || !this.advisors().some((item) => item.userId === advisorUserId)) {
      this.errorState.set('profiles.advisory.errors.denied');
      return;
    }
    const user = this.session.activeUser()!;
    const revision = this.revision;
    this.savingState.set(true);
    this.errorState.set(null);
    this.requests.add(
      this.api
        .getByPlot(plotId)
        .pipe(
          switchMap((previous) => {
            if (
              !this.isCurrent(revision) ||
              !this.owns(plotId) ||
              (previous && previous.producerUserId !== user.id)
            )
              throw new Error('profiles.advisory.errors.denied');
            const assignedAt = new Date().toISOString();
            const history = previous?.history ?? [];
            const record: PlotAdvisorAssignment = {
              id: previous?.id ?? plotId,
              plotId,
              producerUserId: user.id,
              status: 'ACTIVE',
              advisorUserId,
              assignedAt:
                previous?.advisorUserId === advisorUserId ? previous.assignedAt : assignedAt,
              history:
                previous && previous.advisorUserId !== advisorUserId
                  ? [
                      ...history,
                      {
                        advisorUserId: previous.advisorUserId,
                        assignedAt: previous.assignedAt,
                        endedAt: assignedAt,
                      },
                    ]
                  : history,
            };
            return this.api.save(record, previous !== null);
          }),
        )
        .subscribe({
          next: (record) => {
            if (!this.isCurrent(revision)) return;
            this.assignmentState.update((items) => [
              ...items.filter((item) => item.plotId !== plotId),
              record,
            ]);
            this.savingState.set(false);
            onSaved();
          },
          error: (error) => {
            if (!this.isCurrent(revision)) return;
            this.savingState.set(false);
            this.errorState.set(
              error instanceof Error && error.message.startsWith('profiles.advisory.errors.')
                ? error.message
                : 'profiles.advisory.errors.save',
            );
          },
        }),
    );
  }

  private owns(plotId: number): boolean {
    return this.fields
      .plots()
      .some((plot) => plot.id === plotId && plot.ownerUserId === this.session.activeUser()?.id);
  }
  private isCurrent(revision: number): boolean {
    return revision === this.revision && this.current();
  }
}
