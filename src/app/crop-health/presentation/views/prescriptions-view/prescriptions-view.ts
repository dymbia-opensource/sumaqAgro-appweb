import { DatePipe } from '@angular/common';
import { Component, effect, inject, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';

@Component({
  selector: 'app-prescriptions-view',
  imports: [DatePipe, RouterLink, TranslatePipe, MatButtonModule, MatCardModule, MatProgressBarModule],
  templateUrl: './prescriptions-view.html', styleUrl: './prescriptions-view.css',
})
export class PrescriptionsView {
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
}
