import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CurrentSessionService } from '../../../../iam/application/current-session.service';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { SatelliteObservation } from '../../../../crop-health/domain/model/entities/satellite-observation.entity';
import { CropHealthApi } from '../../../../crop-health/infrastructure/crop-health-api';
import { Breadcrumb, PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { MessageCard } from '../../../../shared/presentation/components/message-card/message-card';
import { FieldManagementStore } from '../../../application/field-management.store';
import { CampaignKpiCards } from '../../components/campaign-kpi-cards/campaign-kpi-cards';
import { CostDistributionCard } from '../../components/cost-distribution-card/cost-distribution-card';
import { NdviChartCard } from '../../components/ndvi-chart-card/ndvi-chart-card';

/** Satellite observations of the selected plot and the state of their request. */
interface VegetationState {
  observations: SatelliteObservation[];
  loading: boolean;
  error: boolean;
}

const EMPTY_VEGETATION: VegetationState = { observations: [], loading: false, error: false };

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
  private readonly session = inject(CurrentSessionService);
  private readonly cropHealthApi = inject(CropHealthApi);

  // Store state
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly plots = this.store.plots;
  readonly plot = this.store.selectedPlot;
  readonly campaign = this.store.activeCampaign;
  readonly ledger = this.store.ledger;

  // NDVI of the selected plot: the observations belong to Crop Health and are
  // read through its API, reloading when the selected plot changes.
  private readonly vegetation = toSignal(
    toObservable(this.plot).pipe(
      switchMap((plot) => {
        if (!plot?.hasPolygon()) return of(EMPTY_VEGETATION);
        return this.cropHealthApi.getObservationsByPlot(plot.id as number).pipe(
          map((observations) => ({
            observations: observations
              .filter((item) => item.plotId === plot.id && item.stressAreaHectares <= plot.areaHectares)
              .sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
            loading: false,
            error: false,
          })),
          startWith({ ...EMPTY_VEGETATION, loading: true }),
          catchError(() => of({ ...EMPTY_VEGETATION, error: true })),
        );
      }),
    ),
    { initialValue: EMPTY_VEGETATION },
  );

  /** Satellite observations of the selected plot, oldest first. */
  readonly observations = computed(() => this.vegetation().observations);
  readonly latestObservation = computed(() => this.observations().at(-1));
  readonly observationsLoading = computed(() => this.vegetation().loading);
  readonly observationsError = computed(() => this.vegetation().error);

  // UI state
  protected readonly breadcrumbs: Breadcrumb[] = [{ label: 'option.my-plot' }];
  /** Name for the greeting; for an email, only the part before '@' so it fits on a phone. */
  readonly userName = computed(() => {
    const name = this.session.activeUser()?.displayName ?? '';
    const at = name.indexOf('@');
    return at > 0 ? name.slice(0, at) : name;
  });

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
    const area = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
      plot.areaHectares,
    );
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
