import { Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Breadcrumb, PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { FieldManagementStore } from '../../../application/field-management.store';
import { FieldPlot } from '../../../domain/model/entities/field-plot.entity';
import { PlotCard } from '../../components/plot-card/plot-card';
import { PlotSlotCard } from '../../components/plot-slot-card/plot-slot-card';

/** "My registered plots": one card per plot and one per free slot of the plan (US-22, US-28). */
@Component({
  selector: 'app-registered-plots-view',
  imports: [
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
    TranslatePipe,
    PageHeader,
    MessageCard,
    PlotCard,
    PlotSlotCard,
  ],
  templateUrl: './registered-plots-view.html',
  styleUrl: './registered-plots-view.css',
})
export class RegisteredPlotsView {
  private readonly fieldManagementStore = inject(FieldManagementStore);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // Store state
  readonly plots = this.fieldManagementStore.plots;
  readonly loading = this.fieldManagementStore.loading;
  readonly error = this.fieldManagementStore.error;
  readonly plotCount = this.fieldManagementStore.plotCount;
  readonly plotQuota = this.fieldManagementStore.plotQuota;
  readonly canRegisterPlot = this.fieldManagementStore.canRegisterPlot;

  // UI state
  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'option.my-plot', link: '/field-management/dashboard' },
    { label: 'field-management.plots.manage' },
  ];

  /** Slot numbers still free in the plan (e.g. [3] when 2 of 3 are used). */
  readonly freeSlots = computed(() =>
    Array.from(
      { length: Math.max(this.plotQuota() - this.plotCount(), 0) },
      (_, index) => this.plotCount() + index + 1,
    ),
  );

  /** Current campaign of each plot, by plot ID. */
  readonly campaigns = computed(
    () =>
      new Map(
        this.plots().map((plot) => [
          plot.id,
          this.fieldManagementStore.getCurrentCampaignOf(plot.id as number)(),
        ]),
      ),
  );

  // Actions
  onRegisterNewPlot() {
    this.router.navigate(['field-management/plots/new']).then();
  }

  onSelectPlot(plot: FieldPlot) {
    this.fieldManagementStore.selectPlot(plot.id as number);
    this.router.navigate(['field-management/dashboard']).then();
  }

  onDelineate(plot: FieldPlot) {
    this.router.navigate(['field-management/plots', plot.id, 'boundary']).then();
  }

  /** Deletes the plot only if the producer confirms. */
  onDeletePlot(plot: FieldPlot) {
    const message = this.translate.instant('field-management.plots.delete-confirm', {
      name: plot.name,
    });
    if (confirm(message)) {
      this.fieldManagementStore.deletePlot(plot.id as number);
    }
  }
}
