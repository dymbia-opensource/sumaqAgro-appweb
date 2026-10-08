import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { forkJoin, map, Observable, of, retry, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DelineatePlotBoundaryCommand } from '../domain/model/commands/delineate-plot-boundary.command';
import { RecordSowingDateCommand } from '../domain/model/commands/record-sowing-date.command';
import { RegisterFieldPlotCommand } from '../domain/model/commands/register-field-plot.command';
import { SelectCropTypeCommand } from '../domain/model/commands/select-crop-type.command';
import { SetExpectedYieldCommand } from '../domain/model/commands/set-expected-yield.command';
import { SpecifySeedVarietyCommand } from '../domain/model/commands/specify-seed-variety.command';
import { StartCropCampaignCommand } from '../domain/model/commands/start-crop-campaign.command';
import { CampaignLedger } from '../domain/model/entities/campaign-ledger.entity';
import { CropCampaign } from '../domain/model/entities/crop-campaign.entity';
import { FieldPlot } from '../domain/model/entities/field-plot.entity';
import { FieldManagementApi } from '../infrastructure/field-management-api';

/**
 * Plots included in the free Seed plan.
 *
 * @remarks
 * The quota belongs to Subscriptions and Payments; with the RESTful API,
 * Field Management asks for it before registering a plot.
 */
export const FREE_PLAN_PLOT_QUOTA = 3;

/**
 * Commands of the first campaign of a new plot (US-32 to US-34, US-40).
 *
 * @remarks
 * They follow the EventStorming: start the campaign, select the crop, specify
 * the variety and record the sowing date. The campaign does not exist yet, so
 * the `campaignId` and `ledgerId` of these commands are ignored.
 */
export interface CropCampaignSetup {
  start: StartCropCampaignCommand;
  cropType: SelectCropTypeCommand;
  seedVariety: SpecifySeedVarietyCommand;
  sowingDate: RecordSowingDateCommand;
  expectedYield?: SetExpectedYieldCommand;
}

/**
 * Holds the Field Management state and coordinates its application behavior.
 *
 * @remarks
 * It keeps the producer's plots with their campaigns, the selected plot and the
 * cost ledger of its active campaign. The views send commands and read signals.
 */
@Injectable({ providedIn: 'root' })
export class FieldManagementStore {
  private readonly fieldManagementApi = inject(FieldManagementApi);

  private readonly plotsSignal = signal<FieldPlot[]>([]);
  private readonly campaignsByPlotSignal = signal<Map<number, CropCampaign[]>>(new Map());
  private readonly selectedPlotIdSignal = signal<number | null>(null);
  private readonly ledgerSignal = signal<CampaignLedger | null>(null);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  /** Plots of the producer. */
  readonly plots = this.plotsSignal.asReadonly();

  /** Cost ledger of the active campaign of the selected plot, or `null`. */
  readonly ledger = this.ledgerSignal.asReadonly();

  /** `true` while data is being loaded from or saved to the API. */
  readonly loading = this.loadingSignal.asReadonly();

  /** i18n key of the last error, or `null`. */
  readonly error = this.errorSignal.asReadonly();

  /**
   * Producer signed in: the owner of the plots and of the new plots.
   * It is the demo user until IAM is implemented; then it comes from IamStore.
   */
  readonly currentUserId = signal(environment.demoUserId).asReadonly();

  /** Number of plots of the producer. */
  readonly plotCount = computed(() => this.plots().length);

  /** Plots allowed by the plan of the producer. */
  readonly plotQuota = signal(FREE_PLAN_PLOT_QUOTA).asReadonly();

  /** `true` while the producer can register another plot (US-22). */
  readonly canRegisterPlot = computed(() => this.plotCount() < this.plotQuota());

  /** Plot shown on the dashboard. */
  readonly selectedPlot = computed(() =>
    this.plots().find((plot) => plot.id === this.selectedPlotIdSignal()),
  );

  /** Campaigns of the selected plot. */
  readonly campaigns = computed(
    () => this.campaignsByPlotSignal().get(this.selectedPlotIdSignal() ?? -1) ?? [],
  );

  /** Campaign in progress of the selected plot, or the most recent one. */
  readonly activeCampaign = computed(() => FieldManagementStore.currentOf(this.campaigns()));

  /**
   * Creates an instance of FieldManagementStore and loads the plots of the producer.
   */
  constructor() {
    this.loadMyPlots(this.currentUserId());
  }

  /**
   * Selects a plot by identifier.
   * @param id - Plot identifier.
   * @returns Reactive selection for the requested plot.
   */
  getPlotById = (id: number): Signal<FieldPlot | undefined> =>
    computed(() => this.plots().find((plot) => plot.id === id));

  /**
   * Selects the current campaign of a plot: the one in progress, or the most recent.
   * @param plotId - Plot identifier.
   * @returns Reactive selection for the campaign.
   */
  getCurrentCampaignOf = (plotId: number): Signal<CropCampaign | undefined> =>
    computed(() => FieldManagementStore.currentOf(this.campaignsByPlotSignal().get(plotId) ?? []));

  /**
   * Loads the plots of the producer with their campaigns, and keeps (or selects) the shown plot.
   * @param ownerUserId - Producer who owns the plots.
   */
  loadMyPlots = (ownerUserId: number): void => {
    this.startLoading();
    this.fieldManagementApi
      .getPlotsByOwner(ownerUserId)
      .pipe(
        retry(2),
        switchMap((plots) =>
          plots.length === 0
            ? of({ plots, campaigns: [] as CropCampaign[][] })
            : forkJoin(
                plots.map((plot) => this.fieldManagementApi.getCampaignsByPlot(plot.id as number)),
              ).pipe(map((campaigns) => ({ plots, campaigns }))),
        ),
      )
      .subscribe({
        next: ({ plots, campaigns }) => {
          this.plotsSignal.set(plots);
          this.campaignsByPlotSignal.set(
            new Map(plots.map((plot, index) => [plot.id as number, campaigns[index]])),
          );
          this.loadingSignal.set(false);
          const keep = plots.some((plot) => plot.id === this.selectedPlotIdSignal());
          const first = plots[0];
          if (!keep && first) {
            this.selectPlot(first.id as number);
          }
        },
        error: (error) => this.fail(error, 'field-management.errors.load-plots'),
      });
  };

  /**
   * Selects a plot and loads the cost ledger of its active campaign.
   * @param plotId - Plot to show.
   */
  selectPlot = (plotId: number): void => {
    this.selectedPlotIdSignal.set(plotId);
    this.ledgerSignal.set(null);
    const campaign = this.activeCampaign();
    if (!campaign) return;
    this.startLoading();
    this.fieldManagementApi
      .getLedgerByCampaign(campaign.id as number)
      .pipe(retry(2))
      .subscribe({
        next: (ledger) => {
          this.ledgerSignal.set(ledger);
          this.loadingSignal.set(false);
        },
        error: (error) => this.fail(error, 'field-management.errors.load-plot'),
      });
  };

  /**
   * Registers a plot "without polygon" with its first campaign and its cost ledger (US-28, US-32 to US-36).
   * @param command - Name, region and declared area of the plot.
   * @param setup - Commands of the first campaign.
   * @param onRegistered - Called with the new plot, to continue with its polygon.
   */
  registerPlot = (
    command: RegisterFieldPlotCommand,
    setup: CropCampaignSetup,
    onRegistered?: (plot: FieldPlot) => void,
  ): void => {
    if (!this.canRegisterPlot()) {
      this.errorSignal.set('field-management.errors.quota-reached');
      return;
    }
    this.startLoading();
    const plot = new FieldPlot({
      id: 0,
      ownerUserId: command.ownerUserId,
      name: command.name.trim(),
      region: command.region.trim(),
      areaHectares: command.declaredAreaHectares,
    });
    this.fieldManagementApi
      .createPlot(plot)
      .pipe(
        switchMap((createdPlot) =>
          this.startCampaign(createdPlot.id as number, setup).pipe(
            map((campaign) => ({ createdPlot, campaign })),
          ),
        ),
      )
      .subscribe({
        next: ({ createdPlot, campaign }) => {
          this.plotsSignal.update((plots) => [...plots, createdPlot]);
          this.campaignsByPlotSignal.update((campaigns) =>
            new Map(campaigns).set(createdPlot.id as number, [campaign]),
          );
          this.loadingSignal.set(false);
          this.selectPlot(createdPlot.id as number);
          onRegistered?.(createdPlot);
        },
        error: (error) => this.fail(error, 'field-management.errors.register-plot'),
      });
  };

  /**
   * Saves the GPS polygon of a plot, its area, and activates its satellite monitoring (US-29, US-30).
   * @param command - Plot and vertices of the polygon.
   * @param onDelineated - Called with the saved plot.
   */
  delineateBoundary = (
    command: DelineatePlotBoundaryCommand,
    onDelineated?: (plot: FieldPlot) => void,
  ): void => {
    const current = this.plots().find((plot) => plot.id === command.plotId);
    if (!current) return;
    const plot = this.copyPlot(current);
    try {
      plot.delineateBoundary(command.coordinates);
      // With the fake API there is no AgroMonitoring: the identifier is simulated.
      plot.activateMonitoring(
        current.agroMonitoringPolygonId ?? crypto.randomUUID().replace(/-/g, '').slice(0, 24),
      );
    } catch (error) {
      this.fail(error, 'field-management.errors.invalid-polygon');
      return;
    }
    this.startLoading();
    this.fieldManagementApi
      .updateBoundary(plot)
      .pipe(retry(2))
      .subscribe({
        next: (updated) => {
          this.plotsSignal.update((plots) =>
            plots.map((item) => (item.id === updated.id ? updated : item)),
          );
          this.loadingSignal.set(false);
          onDelineated?.(updated);
        },
        error: (error) => this.fail(error, 'field-management.errors.save-polygon'),
      });
  };

  /**
   * Deletes a plot by ID.
   * @param id - The ID of the plot to delete.
   */
  deletePlot = (id: number): void => {
    this.startLoading();
    this.fieldManagementApi
      .deletePlot(id)
      .pipe(retry(2))
      .subscribe({
        next: () => {
          this.plotsSignal.update((plots) => plots.filter((plot) => plot.id !== id));
          this.loadingSignal.set(false);
          if (this.selectedPlotIdSignal() === id) {
            const first = this.plots()[0];
            this.selectedPlotIdSignal.set(null);
            this.ledgerSignal.set(null);
            if (first) this.selectPlot(first.id as number);
          }
        },
        error: (error) => this.fail(error, 'field-management.errors.delete-plot'),
      });
  };

  /**
   * Starts the first campaign of a plot and opens its cost ledger.
   *
   * @remarks
   * With the RESTful API the backend opens the ledger when the campaign starts
   * (policy P8); with the fake API the store creates it.
   */
  private startCampaign(plotId: number, setup: CropCampaignSetup): Observable<CropCampaign> {
    const campaign = new CropCampaign({
      id: 0,
      plotId,
      season: setup.start.season,
      cropType: setup.cropType.cropType,
      seedVariety: setup.seedVariety.varietyName,
    });
    const ledger = new CampaignLedger({
      id: 0,
      campaignId: 0,
      yieldUnit: CampaignLedger.yieldUnitOf(setup.cropType.cropType),
    });
    try {
      campaign.selectCropType(setup.cropType.cropType);
      campaign.specifySeedVariety(setup.seedVariety.varietyName);
      campaign.recordSowingDate(setup.sowingDate.sowingDate);
      if (setup.expectedYield) {
        ledger.setExpectedYield(setup.expectedYield.expectedYield, setup.expectedYield.unit);
      }
    } catch (error) {
      return throwError(() => error);
    }
    return this.fieldManagementApi.createCampaign(campaign).pipe(
      switchMap((created) =>
        this.fieldManagementApi
          .createLedger(
            new CampaignLedger({
              id: 0,
              campaignId: created.id as number,
              expectedYield: ledger.expectedYield,
              yieldUnit: ledger.yieldUnit,
            }),
          )
          .pipe(map(() => created)),
      ),
    );
  }

  /** Copy of a plot, so the list only changes when the API confirms the change. */
  private copyPlot(plot: FieldPlot): FieldPlot {
    return new FieldPlot({
      id: plot.id as number,
      ownerUserId: plot.ownerUserId,
      name: plot.name,
      region: plot.region,
      status: plot.status,
      boundary: plot.boundary,
      areaHectares: plot.areaHectares,
      agroMonitoringPolygonId: plot.agroMonitoringPolygonId,
      soilBaseline: plot.soilBaseline,
    });
  }

  /** Campaign in progress, or the most recent one. */
  private static currentOf(campaigns: CropCampaign[]): CropCampaign | undefined {
    return campaigns.find((campaign) => campaign.isActive()) ?? campaigns.at(-1);
  }

  private startLoading(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
  }

  /**
   * Normalizes an error into an i18n key to show it in the view.
   * @param error - Source error.
   * @param fallbackKey - i18n key of the failed operation.
   */
  private fail(error: unknown, fallbackKey: string): void {
    console.error(error);
    this.errorSignal.set(fallbackKey);
    this.loadingSignal.set(false);
  }
}
