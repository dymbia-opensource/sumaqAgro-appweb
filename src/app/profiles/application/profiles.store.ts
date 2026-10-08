import { computed, inject, Service, signal } from '@angular/core';
import { finalize, of, switchMap, throwError } from 'rxjs';
import { UpdateFarmerContactCommand } from '../domain/model/commands/update-farmer-contact.command';
import { CooperativeMember } from '../domain/model/entities/cooperative-member.entity';
import { Cooperative } from '../domain/model/entities/cooperative.entity';
import { CooperativeDashboard } from '../domain/model/entities/cooperative-dashboard.entity';
import { FarmerProfile } from '../domain/model/entities/farmer-profile.entity';
import { ProfilesApi } from '../infrastructure/profiles-api';

/** Coordinates the institutional Profile read models for a cooperative director. */
@Service()
export class ProfilesStore {
  private readonly profilesApi = inject(ProfilesApi);
  private readonly profileSignal = signal<FarmerProfile | null>(null);
  private readonly cooperativeSignal = signal<Cooperative | null>(null);
  private readonly membersSignal = signal<CooperativeMember[]>([]);
  private readonly dashboardSignal = signal<CooperativeDashboard | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly profile = this.profileSignal.asReadonly();
  readonly cooperative = this.cooperativeSignal.asReadonly();
  readonly members = this.membersSignal.asReadonly();
  readonly dashboard = this.dashboardSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly activeMemberCount = computed(() => this.members().filter((member) => member.active).length);

  /** Loads the personal contact profile of the independent farmer. */
  loadFarmerProfile(userId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.profilesApi
      .getFarmerProfile(userId)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (profile) => this.profileSignal.set(profile),
        error: (error: Error) => this.errorSignal.set(error.message),
      });
  }

  /** Validates and persists the farmer's contact data. */
  saveContact(command: UpdateFarmerContactCommand): void {
    const profile = this.profileSignal();
    if (!profile) return;

    try {
      profile.updateContact(command.phoneNumber, command.email);
    } catch (error) {
      this.errorSignal.set(error instanceof Error ? error.message : 'Invalid contact data.');
      return;
    }

    this.savingSignal.set(true);
    this.errorSignal.set(null);
    this.profilesApi
      .updateFarmerProfile(profile)
      .pipe(finalize(() => this.savingSignal.set(false)))
      .subscribe({
        next: (updatedProfile) => this.profileSignal.set(updatedProfile),
        error: (error: Error) => this.errorSignal.set(error.message),
      });
  }

  /** Loads the role-specific read model for the active cooperative director. */
  loadCooperativeDashboard(directorUserId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.profilesApi.getInstitutionalDashboard(directorUserId).subscribe({
      next: (dashboard) => {
        this.dashboardSignal.set(dashboard);
        this.loadingSignal.set(false);
      },
      error: (error: Error) => {
        this.errorSignal.set(error.message);
        this.loadingSignal.set(false);
      },
    });
  }

  /** Loads the cooperative and its member summary for the active director. */
  loadInstitutionalDashboard(directorUserId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.profilesApi
      .getCooperativeByDirector(directorUserId)
      .pipe(switchMap((cooperative) => {
        this.cooperativeSignal.set(cooperative);
        return cooperative ? this.profilesApi.getCooperativeMembers(cooperative.id as number) : of([]);
      }))
      .subscribe({
        next: (members) => { this.membersSignal.set(members); this.loadingSignal.set(false); },
        error: (error: Error) => { this.errorSignal.set(error.message); this.loadingSignal.set(false); },
      });
  }


}
