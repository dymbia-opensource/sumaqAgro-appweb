import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DemoSessionService } from '../../../../shared/application/demo-session.service';
import { Breadcrumb, PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { FieldManagementStore } from '../../../application/field-management.store';
import { CampaignKpiCards } from '../../components/campaign-kpi-cards/campaign-kpi-cards';
import { CostDistributionCard } from '../../components/cost-distribution-card/cost-distribution-card';
import { NdviChartCard } from '../../components/ndvi-chart-card/ndvi-chart-card';

/** "My Plot": start page of the producer with costs, breakeven price and NDVI (US-16 to US-19). */
@Component({
  selector: 'app-my-plot-dashboard-view',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    TranslatePipe,
    PageHeader,
    MessageCard,
    CampaignKpiCards,
    NdviChartCard,
    CostDistributionCard,
  ],
  templateUrl: './my-plot-dashboard-view.html',
  styleUrl: './my-plot-dashboard-view.css',
})
export class MyPlotDashboardView {
  private readonly store = inject(FieldManagementStore);
  private readonly demoSession = inject(DemoSessionService);

  // Store state
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly plots = this.store.plots;
  readonly plot = this.store.selectedPlot;
  readonly campaign = this.store.activeCampaign;
  readonly ledger = this.store.ledger;
  readonly observations = this.store.observations;
  readonly latestObservation = this.store.latestObservation;
  readonly observationsLoading = this.store.observationsLoading;
  readonly observationsError = this.store.observationsError;

  // UI state
  protected readonly breadcrumbs: Breadcrumb[] = [{ label: 'option.my-plot' }];
  readonly userName = computed(() => this.demoSession.activeUser()?.displayName ?? '');

  /** Greeting by time of day: morning, afternoon or evening. */
  readonly greetingKey = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'field-management.dashboard.good-morning';
    if (hour < 19) return 'field-management.dashboard.good-afternoon';
    return 'field-management.dashboard.good-evening';
  });

  /** Subtitle, e.g. "Pampa Alta – Papa Yungay (2.5 Ha)". */
  readonly plotSummary = computed(() => {
    const plot = this.plot();
    if (!plot) return '';
    const variety = this.campaign()?.seedVariety;
    const area = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(plot.areaHectares);
    return `${plot.name}${variety ? ` – ${variety}` : ''} (${area} Ha)`;
  });

  // Actions
  retry(): void {
    const userId = this.store.currentUserId();
    if (userId !== null) {
      this.store.loadMyPlots(userId);
    }
  }
}
