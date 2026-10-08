import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FieldManagementStore } from '../../../application/field-management.store';
import { FieldPlot } from '../../../domain/model/entities/field-plot.entity';

/**
 * "My registered plots": one card per plot and one per free slot of the plan (US-22, US-28).
 *
 * @remarks
 * A monitored plot opens its satellite monitoring; a plot without polygon
 * opens the map to delineate it. A free slot starts the registration.
 */
@Component({
  selector: 'app-registered-plots-view',
  imports: [
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    TranslatePipe,
  ],
  templateUrl: './registered-plots-view.html',
  styleUrl: './registered-plots-view.css',
})
export class RegisteredPlotsView {
  private readonly fieldManagementStore = inject(FieldManagementStore);
  protected router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly plots = this.fieldManagementStore.plots;
  readonly loading = this.fieldManagementStore.loading;
  readonly error = this.fieldManagementStore.error;
  readonly plotCount = this.fieldManagementStore.plotCount;
  readonly plotQuota = this.fieldManagementStore.plotQuota;
  readonly canRegisterPlot = this.fieldManagementStore.canRegisterPlot;

  /** Numbers of the free slots of the plan, after the registered plots. */
  readonly freeSlots = computed(() =>
    Array.from(
      { length: Math.max(this.plotQuota() - this.plotCount(), 0) },
      (_, index) => this.plotCount() + index + 1,
    ),
  );

  /** Current campaign of each plot, to show its crop and variety. */
  readonly campaigns = computed(
    () =>
      new Map(
        this.plots().map((plot) => [
          plot.id,
          this.fieldManagementStore.getCurrentCampaignOf(plot.id as number)(),
        ]),
      ),
  );

  /** Navigates to the registration of a new plot. */
  onRegisterNewPlot() {
    this.router.navigate(['field-management/plots/new']).then();
  }

  /**
   * Shows a plot on the "My Plot" dashboard.
   * @param plotId - The ID of the plot.
   */
  onSelectPlot(plotId: number | string) {
    this.fieldManagementStore.selectPlot(Number(plotId));
    this.router.navigate(['field-management/dashboard']).then();
  }

  /**
   * Navigates to the map to delineate the polygon of a plot.
   * @param plotId - The ID of the plot.
   */
  onDelineate(plotId: number | string) {
    this.router.navigate(['field-management/plots', plotId, 'boundary']).then();
  }

  /**
   * Deletes a plot after the producer confirms it.
   * @param plot - The plot to delete.
   */
  onDeletePlot(plot: FieldPlot) {
    const message = this.translate.instant('field-management.plots.delete-confirm', {
      name: plot.name,
    });
    if (confirm(message)) {
      this.fieldManagementStore.deletePlot(plot.id as number);
    }
  }
}
