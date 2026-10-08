import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';
import { IssueTechnicalPrescriptionCommand } from '../../../domain/model/commands/issue-technical-prescription.command';

@Component({
  selector: 'app-prescription-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule],
  templateUrl: './prescription-form.html', styleUrl: './prescription-form.css',
})
export class PrescriptionForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(CropHealthStore);
  readonly saved = signal(false);
  readonly prescriptionForm = this.fb.group({
    reportId: [0, Validators.min(1)], agronomistId: [0, Validators.min(1)],
    agrochemical: ['', [Validators.required, Validators.pattern(/\S/)]],
    dosage: ['', [Validators.required, Validators.pattern(/\S/)]],
    instructions: ['', [Validators.required, Validators.pattern(/\S/)]],
    applicationDate: ['', Validators.required],
  });
  ngOnInit(): void {
    this.store.loadClinicalData(() => {
      const reportId = Number(this.route.snapshot.queryParamMap.get('reportId'));
      if (this.store.pestReports().some(report => report.id === reportId)) {
        this.prescriptionForm.controls.reportId.setValue(reportId);
      }
    });
  }
  onSubmit(): void {
    this.saved.set(false);
    this.prescriptionForm.markAllAsTouched();
    const value = this.prescriptionForm.getRawValue();
    if (this.prescriptionForm.invalid || this.store.loading() || this.store.saving()) return;
    if (!this.store.pestReports().some(report => report.id === value.reportId) ||
        !this.store.advisors().some(advisor => advisor.id === value.agronomistId)) return;
    if (!Number.isFinite(Date.parse(value.applicationDate))) {
      this.prescriptionForm.controls.applicationDate.setErrors({ invalidDate: true }); return;
    }
    this.prescriptionForm.disable();
    this.store.issuePrescription(new IssueTechnicalPrescriptionCommand({
      reportId: value.reportId, agronomistId: value.agronomistId,
      recommendedProducts: value.agrochemical.trim(),
      dosageInstructions: value.dosage.trim() + '\n' + value.instructions.trim(),
      applicationDate: value.applicationDate,
    }), () => {
      this.prescriptionForm.reset({ reportId: value.reportId, agronomistId: value.agronomistId });
      this.prescriptionForm.enable(); this.saved.set(true);
    }, () => this.prescriptionForm.enable());
  }
}
