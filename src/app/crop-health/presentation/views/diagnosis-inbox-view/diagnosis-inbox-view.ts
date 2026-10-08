import { Component, effect, inject, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';

@Component({
  selector: 'app-diagnosis-inbox-view',
  imports: [RouterLink, TranslatePipe, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './diagnosis-inbox-view.html', styleUrl: './diagnosis-inbox-view.css',
})
export class DiagnosisInboxView {
  readonly store = inject(CropHealthStore);
  constructor() {
    effect(() => {
      const ready = this.store.scopeReady();
      untracked(() => {

        if (ready) this.load();
      });
    });
  }
  private load(): void { this.store.loadClinicalData(); }
  resolve(id: number): void { this.store.resolveReport(id, () => {}, () => {}); }
}
