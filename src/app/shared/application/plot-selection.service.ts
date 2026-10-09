import { computed, inject, Service, signal } from '@angular/core';
import { DemoSessionService } from './demo-session.service';

/** Shares plot selection between Field Management and Crop Health for each demo user. */
@Service()
export class PlotSelectionService {
  private readonly session = inject(DemoSessionService);
  private readonly selections = signal<Record<number, number | null>>({});
  readonly selectedPlotId = computed(() => {
    const id = this.session.activeUser()?.id;
    return id === undefined ? null : this.selections()[id] ?? null;
  });
  select(plotId: number | null): void {
    const user = this.session.activeUser();
    if (user) this.selections.update(items => ({ ...items, [user.id]: plotId }));
  }
}
