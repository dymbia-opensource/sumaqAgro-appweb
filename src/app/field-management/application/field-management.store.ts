import { computed, inject, Service, signal } from '@angular/core';
import { of, retry, switchMap, tap } from 'rxjs';
import { CampaignLedger } from '../domain/model/entities/campaign-ledger.entity';
import { CropCampaign } from '../domain/model/entities/crop-campaign.entity';
import { FieldPlot } from '../domain/model/entities/field-plot.entity';
import { FieldManagementApi } from '../infrastructure/field-management-api';

/**
 * Application store of Field Management.
 *
 * @remarks
 * It keeps the producer's plots, the selected plot, its campaigns and the
 * cost ledger of the active campaign as signals for the presentation layer.
 */
@Service()
export class FieldManagementStore {
  private readonly fieldManagementApi = inject(FieldManagementApi);

  private readonly plotsSignal = signal<FieldPlot[]>([]);
  private readonly selectedPlotIdSignal = signal<number | null>(null);
  private readonly campaignsSignal = signal<CropCampaign[]>([]);
  private readonly ledgerSignal = signal<CampaignLedger | null>(null);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  /** Plots of the producer. */
  readonly plots = this.plotsSignal.asReadonly();

  /** Campaigns of the selected plot. */
  readonly campaigns = this.campaignsSignal.asReadonly();

  /** Cost ledger of the active campaign, or `null` if it has none. */
  readonly ledger = this.ledgerSignal.asReadonly();

  /** `true` while data is being loaded from the API. */
  readonly loading = this.loadingSignal.asReadonly();

  /** Last error message, or `null`. */
  readonly error = this.errorSignal.asReadonly();

  /** Number of plots of the producer. */
  readonly plotCount = computed(() => this.plots().length);

  /** Plot shown on the dashboard. */
  readonly selectedPlot = computed(() =>
    this.plots().find((plot) => plot.id === this.selectedPlotIdSignal()),
  );

  /** Campaign in progress of the selected plot, or the most recent one. */
  readonly activeCampaign = computed(() => {
    const campaigns = this.campaigns();
    return campaigns.find((campaign) => campaign.isActive()) ?? campaigns.at(-1);
  });

  /**
   * Loads the plots of the producer and selects the first one.
   * @param ownerUserId - Producer who owns the plots.
   */
  loadMyPlots(ownerUserId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.fieldManagementApi
      .getPlotsByOwner(ownerUserId)
      .pipe(retry(2))
      .subscribe({
        next: (plots) => {
          this.plotsSignal.set(plots);
          this.loadingSignal.set(false);
          const current = this.selectedPlotIdSignal();
          const keep = plots.some((plot) => plot.id === current);
          const first = plots[0];
          if (!keep && first) {
            this.selectPlot(first.id as number);
          }
        },
        error: (error: Error) => this.fail(error),
      });
  }

  /**
   * Selects a plot and loads its campaigns and the ledger of the active campaign.
   * @param plotId - Plot to show.
   */
  selectPlot(plotId: number): void {
    this.selectedPlotIdSignal.set(plotId);
    this.campaignsSignal.set([]);
    this.ledgerSignal.set(null);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.fieldManagementApi
      .getCampaignsByPlot(plotId)
      .pipe(
        retry(2),
        tap((campaigns) => this.campaignsSignal.set(campaigns)),
        switchMap(() => {
          const campaign = this.activeCampaign();
          return campaign
            ? this.fieldManagementApi.getLedgerByCampaign(campaign.id as number)
            : of(null);
        }),
      )
      .subscribe({
        next: (ledger) => {
          this.ledgerSignal.set(ledger);
          this.loadingSignal.set(false);
        },
        error: (error: Error) => this.fail(error),
      });
  }

  private fail(error: Error): void {
    this.errorSignal.set(error.message);
    this.loadingSignal.set(false);
  }
}
