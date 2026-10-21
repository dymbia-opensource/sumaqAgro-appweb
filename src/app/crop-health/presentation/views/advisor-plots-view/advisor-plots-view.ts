import { Component, effect, inject, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';

/** Assigned plot directory, including plots without cases and producers outside cooperatives. */
@Component({
  selector: 'app-advisor-plots-view',
  imports: [RouterLink, TranslatePipe, MatButtonModule, MatCardModule, MatProgressBarModule],
  templateUrl: './advisor-plots-view.html',
  styles: [
    ':host { display: block; max-width: 1100px; margin: auto; } .plots { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr)); gap:16px; } mat-card-content { padding-top:16px; } nav { display:flex; flex-wrap:wrap; gap:12px; margin-bottom:20px; }',
  ],
})
export class AdvisorPlotsView {
  readonly store = inject(CropHealthStore);
  constructor() {
    effect(() => {
      const ready = this.store.scopeReady();
      untracked(() => {
        if (ready) this.store.loadClinicalData();
      });
    });
  }
  /** Counts all unresolved cases, including those awaiting farmer follow-up. */
  pending(plotId: number): number {
    return this.store
      .pestReports()
      .filter((report) => report.plotId === plotId && report.status !== 'RESOLVED').length;
  }
  /** Resolves fresh responsibilities before reloading work-list totals. */
  reload(): void {
    this.store.retryScope();
  }
}
