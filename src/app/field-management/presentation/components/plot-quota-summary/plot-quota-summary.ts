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
  styles: [
    ':host { display:block; padding:20px; border:1px solid var(--mat-sys-outline-variant); border-radius:16px; background:var(--mat-sys-surface-container-low); } p { margin:0 0 12px; } mat-progress-bar { margin-bottom:12px; }',
  ],
})
export class PlotQuotaSummary {
  readonly store = inject(FieldManagementStore);

  /** Explicitly retries the current producer's quota query without changing accounts. */
  refresh(): void {
    const owner = this.store.currentUserId();
    if (owner !== null && !this.store.loading()) this.store.loadMyPlots(owner);
  }
}
