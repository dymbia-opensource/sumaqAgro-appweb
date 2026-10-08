import { DatePipe } from '@angular/common';
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
import { ScheduleFieldInspectionCommand } from '../../../domain/model/commands/schedule-field-inspection.command';

@Component({
  selector: 'app-field-inspections-view',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, TranslatePipe, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule],
  templateUrl: './field-inspections-view.html', styleUrl: './field-inspections-view.css',
})
export class FieldInspectionsView implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(CropHealthStore);
  readonly saved = signal(false);
  readonly inspectionForm = this.fb.group({
    reportId: [0, Validators.min(1)], scheduledAt: ['', Validators.required], notes: [''],
  });
  ngOnInit(): void {
    this.store.loadClinicalData(() => {
      const reportId = Number(this.route.snapshot.queryParamMap.get('reportId'));
      if (this.store.pestReports().some(report => report.id === reportId)) {
        this.inspectionForm.controls.reportId.setValue(reportId);
      }
    });
  }
  onSubmit(): void {
    this.saved.set(false);
    this.inspectionForm.markAllAsTouched();
    const value = this.inspectionForm.getRawValue();
    if (this.inspectionForm.invalid || this.store.loading() || this.store.saving()) return;
    if (!this.store.pestReports().some(report => report.id === value.reportId)) return;
    const date = new Date(value.scheduledAt);
    if (!Number.isFinite(date.getTime())) {
      this.inspectionForm.controls.scheduledAt.setErrors({ invalidDate: true }); return;
    }
    this.inspectionForm.disable();
    this.store.scheduleInspection(new ScheduleFieldInspectionCommand({
      reportId: value.reportId, scheduledAt: date.toISOString(), notes: value.notes.trim(),
    }), () => {
      this.inspectionForm.reset({ reportId: value.reportId });
      this.inspectionForm.enable(); this.saved.set(true);
    }, () => this.inspectionForm.enable());
  }
}
