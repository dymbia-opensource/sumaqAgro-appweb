import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';
import { todayInLima } from '../../../domain/model/validation';

/**
 * Incident dossier with visits, prescriptions and immutable farmer follow-up.
 * @remarks
 * Absence, loading and failed queries are separate states. Application/evolution
 * evidence does not close the report or replace the agronomist's assessment.
 */
@Component({
  selector: 'app-farmer-case-view',
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  templateUrl: './farmer-case-view.html',
  styleUrl: './farmer-case-view.css',
})
export class FarmerCaseView {
  private readonly translate = inject(TranslateService);
  readonly locale = computed(() => (this.translate.currentLang() === 'es' ? 'es' : 'en'));
  readonly id = input.required({ transform: numberAttribute });
  readonly store = inject(CropHealthStore);
  readonly report = computed(() => this.store.pestReports().find((item) => item.id === this.id()));
  readonly inspections = computed(() =>
    this.store.inspections().filter((item) => item.reportId === this.id()),
  );
  readonly prescriptions = computed(() =>
    this.store.prescriptions().filter((item) => item.reportId === this.id()),
  );
  readonly evidence = computed(() =>
    this.store
      .followUps()
      .filter((item) => item.data.reportId === this.id())
      .sort(
        (a, b) =>
          a.data.occurredOn.localeCompare(b.data.occurredOn) ||
          a.data.recordedAt.localeCompare(b.data.recordedAt),
      ),
  );
  readonly saved = signal(false);
  readonly loaded = signal(false);
  readonly today = todayInLima();
  private readonly formDirective = viewChild(FormGroupDirective);
  private draft: { fingerprint: string; id: string } | null = null;
  readonly form = new FormGroup({
    prescriptionId: new FormControl(0, { nonNullable: true, validators: [Validators.min(1)] }),
    kind: new FormControl<'APPLICATION' | 'EVOLUTION'>('APPLICATION', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    occurredOn: new FormControl(todayInLima(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    notes: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(2000)],
    }),
  });

  constructor() {
    effect(() => {
      const ready = this.store.scopeReady();
      const user = this.store.activeUser();
      const id = this.id();
      untracked(() => {
        this.loaded.set(false);
        this.saved.set(false);
        this.draft = null;
        this.form.enable();
        this.form.reset({
          prescriptionId: 0,
          kind: 'APPLICATION',
          occurredOn: todayInLima(),
          notes: '',
        });
        if (ready && user && Number.isSafeInteger(id) && id > 0) this.reload();
        else if (ready) this.loaded.set(true);
      });
    });
  }

  /** Loads the authorized report dossier without querying arbitrary report IDs directly. */
  reload(): void {
    this.loaded.set(false);
    if (this.store.scopeError()) {
      this.store.retryScope();
      return;
    }
    this.store.loadClinicalData(() => {
      this.loaded.set(true);
      if (!this.form.controls.prescriptionId.value)
        this.form.controls.prescriptionId.setValue(Number(this.prescriptions()[0]?.id ?? 0));
    });
  }

  /** Shows the prescribed product beside each evidence record. */
  prescriptionLabel(id: number): string {
    return this.prescriptions().find((item) => item.id === id)?.recommendedProducts ?? `#${id}`;
  }

  /**
   * Sends validated evidence; retries keep the same client ID and preserve failed drafts.
   * @remarks Application IDs are deterministic per prescription and producer to prevent
   * duplicate confirmations after an interrupted response from the fake API.
   */
  submit(): void {
    this.saved.set(false);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.store.saving() || this.store.clinicalLoading() || !this.report())
      return;
    const value = this.form.getRawValue();
    const notes = value.notes.trim();
    if (notes.length < 10) {
      this.form.controls.notes.setErrors({ minlength: true });
      return;
    }
    const fingerprint = JSON.stringify({ ...value, notes, reportId: this.id() });
    if (this.draft?.fingerprint !== fingerprint)
      this.draft = {
        fingerprint,
        id:
          value.kind === 'APPLICATION'
            ? `application-${value.prescriptionId}-${this.store.activeUser()!.id}`
            : crypto.randomUUID(),
      };
    this.form.disable();
    this.store.recordFollowUp(
      { ...value, notes, id: this.draft.id, reportId: this.id() },
      () => {
        const values = this.form.getRawValue();
        this.form.enable();
        this.formDirective()?.resetForm({ ...values, notes: '', kind: 'EVOLUTION' });
        this.draft = null;
        this.saved.set(true);
      },
      () => this.form.enable(),
    );
  }
}
