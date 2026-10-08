import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { FieldManagementApi } from '../../../../field-management/infrastructure/field-management-api';
import { FieldPlot } from '../../../../field-management/domain/model/entities/field-plot.entity';
import { DemoSessionService } from '../../../../shared/application/demo-session.service';
import { CropHealthStore } from '../../../application/crop-health.store';
import { RecordPestReportCommand } from '../../../domain/model/commands/record-pest-report.command';

@Component({
  selector: 'app-pest-report-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule],
  templateUrl: './pest-report-form.html', styleUrl: './pest-report-form.css',
})
export class PestReportForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly session = inject(DemoSessionService);
  private readonly fields = inject(FieldManagementApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly store = inject(CropHealthStore);
  readonly plots = signal<FieldPlot[]>([]);
  readonly loadingPlots = signal(false);
  readonly optionsError = signal('');
  readonly saved = signal(false);
  readonly reportForm = this.fb.group({
    plotId: [0, Validators.min(1)],
    description: ['', [Validators.required, Validators.minLength(10), Validators.pattern(/\S/)]],
    severity: ['LOW', Validators.required],
    photoUrl: ['', Validators.pattern(/^https?:\/\/\S+$/)],
  });

  constructor() {
    this.store.clearError();
    const user = this.session.activeUser();
    if (!user) { this.optionsError.set('crop-health.errors.session-required'); return; }
    this.loadingPlots.set(true);
    this.fields.getPlotsByOwner(user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: plots => { this.plots.set(plots); this.loadingPlots.set(false); },
      error: () => { this.optionsError.set('crop-health.errors.load-plots'); this.loadingPlots.set(false); },
    });
  }

  onSubmit(): void {
    this.saved.set(false);
    const value = this.reportForm.getRawValue();
    this.reportForm.controls.description.setValue(value.description.trim());
    this.reportForm.markAllAsTouched();
    const user = this.session.activeUser();
    const plot = this.plots().find(item => item.id === value.plotId);
    if (this.reportForm.invalid || this.store.saving() || !user || !plot || plot.ownerUserId !== user.id) return;
    this.reportForm.disable();
    this.store.recordReport(new RecordPestReportCommand({
      plotId: value.plotId, plotName: plot.name, reporterId: user.id,
      description: value.description.trim(), severity: value.severity,
      photo: value.photoUrl.trim(), clientSyncId: crypto.randomUUID(),
    }), () => {
      this.reportForm.reset({ plotId: value.plotId, description: '', severity: 'LOW', photoUrl: '' });
      this.reportForm.enable();
      this.saved.set(true);
    }, () => this.reportForm.enable());
  }
}
