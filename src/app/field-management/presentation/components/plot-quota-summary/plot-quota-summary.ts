import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { FieldManagementStore } from '../../../application/field-management.store';

/** Shared Seed-plan usage indicator; an unavailable count is never presented as free capacity. */
@Component({
  selector: 'app-plot-quota-summary',
  imports: [TranslatePipe, MatButtonModule, MatProgressBarModule],
  templateUrl: './plot-quota-summary.html',
  styleUrl: './plot-quota-summary.css',
})
export class PlotQuotaSummary {
  readonly store = inject(FieldManagementStore);

  /** Explicitly retries the current producer's quota query without changing accounts. */
  refresh(): void {
    const owner = this.store.currentUserId();
    if (owner !== null && !this.store.loading()) this.store.loadMyPlots(owner);
  }
}
