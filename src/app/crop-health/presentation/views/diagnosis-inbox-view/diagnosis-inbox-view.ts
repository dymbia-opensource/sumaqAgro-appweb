import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';

@Component({
  selector: 'app-diagnosis-inbox-view',
  imports: [RouterLink, TranslatePipe, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './diagnosis-inbox-view.html', styleUrl: './diagnosis-inbox-view.css',
})
export class DiagnosisInboxView {
  readonly store = inject(CropHealthStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  readonly deletingId = signal<number | null>(null);
  readonly reports = computed(() => [...this.store.pestReports()].sort((a, b) => Number(b.id) - Number(a.id)));
  constructor() {
    effect(() => {
      const ready = this.store.scopeReady();
      untracked(() => { this.deletingId.set(null); if (ready) this.store.loadClinicalData(); });
    });
  }
  remove(id: number): void {
    this.store.deleteReport(id, () => {
      this.deletingId.set(null);
      this.snackBar.open(this.translate.instant('crop-health.report-deleted'), undefined, { duration: 5000 });
    }, () => this.deletingId.set(null));
  }
  resolve(id: number): void {
    this.store.resolveReport(id, () => {
      this.snackBar.open(this.translate.instant('crop-health.report-resolved'), undefined, { duration: 5000 });
    }, () => {});
  }
}
