import { computed, inject, Service, signal } from '@angular/core';
import { CurrentSessionService } from '../../iam/application/current-session.service';

/**
 * Shares plot selection between contexts for the authenticated account.
 */
@Service()
export class PlotSelectionService {
  private readonly session = inject(CurrentSessionService);

  private readonly selection = signal<{
    participant: object;
    plotId: number | null;
  } | null>(null);

  readonly selectedPlotId = computed(() => {
    const user = this.session.activeUser();
    const selection = this.selection();

    return user && selection?.participant === user ? selection.plotId : null;
  });

  select(plotId: number | null): void {
    const user = this.session.activeUser();

    if (!user) return;

    this.selection.set({
      participant: user,
      plotId,
    });
  }
}
