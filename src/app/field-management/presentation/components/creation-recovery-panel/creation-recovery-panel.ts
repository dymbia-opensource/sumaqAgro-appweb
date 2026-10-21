import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { FieldManagementStore } from '../../../application/field-management.store';

/** Displays the persisted operation and retries its missing steps, even when all plot slots are occupied. */
@Component({
  selector: 'app-creation-recovery-panel',
  imports: [TranslatePipe, MatButtonModule],
  templateUrl: './creation-recovery-panel.html',
  styles: [
    ':host { display:block; } section { padding:20px; border:1px solid var(--mat-sys-outline); border-radius:16px; margin-top:16px; } h2 { font-size:1.15rem; margin:0 0 12px; } p { overflow-wrap:anywhere; }',
  ],
})
export class CreationRecoveryPanel {
  readonly store = inject(FieldManagementStore);
  private readonly router = inject(Router);

  /** Resumes the original operation and navigates only after its complete server confirmation. */
  resume(): void {
    const draft = this.store.pendingCreation();
    if (!draft) return;
    this.store.resumePendingCreation((plot) => {
      void this.router.navigate(
        draft.mode === 'REGISTRATION'
          ? ['/field-management/plots', plot.id, 'boundary']
          : ['/field-management/campaigns'],
      );
    });
  }
}
