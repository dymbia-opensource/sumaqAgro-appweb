import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  Signal,
  signal,
  untracked,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  tap,
  concatMap,
  forkJoin,
  from,
  map,
  Observable,
  of,
  retry,
  startWith,
  Subscription,
  switchMap,
  throwError,
} from 'rxjs';
import { SatelliteObservation } from '../../crop-health/domain/model/entities/satellite-observation.entity';
import { CropHealthApi } from '../../crop-health/infrastructure/crop-health-api';
import { DemoSessionService } from '../../shared/application/demo-session.service';
import { PlotSelectionService } from '../../shared/application/plot-selection.service';
import { CloseCropCampaignCommand } from '../domain/model/commands/close-crop-campaign.command';
import { DelineatePlotBoundaryCommand } from '../domain/model/commands/delineate-plot-boundary.command';
import { ExportCampaignCostReportCommand } from '../domain/model/commands/export-campaign-cost-report.command';
import { LinkPlotPolygonCommand } from '../domain/model/commands/link-plot-polygon.command';
import { OpenCampaignLedgerCommand } from '../domain/model/commands/open-campaign-ledger.command';
import { RecordActualYieldCommand } from '../domain/model/commands/record-actual-yield.command';
import { RecordDailyLaborExpenseCommand } from '../domain/model/commands/record-daily-labor-expense.command';
import { RecordInputExpenseCommand } from '../domain/model/commands/record-input-expense.command';
import { RecordSoilBaselineCommand } from '../domain/model/commands/record-soil-baseline.command';
import { RecordSowingDateCommand } from '../domain/model/commands/record-sowing-date.command';
import { RegisterFieldPlotCommand } from '../domain/model/commands/register-field-plot.command';
import { SelectCropTypeCommand } from '../domain/model/commands/select-crop-type.command';
import { SetExpectedYieldCommand } from '../domain/model/commands/set-expected-yield.command';
import { SpecifySeedVarietyCommand } from '../domain/model/commands/specify-seed-variety.command';
import { StartCropCampaignCommand } from '../domain/model/commands/start-crop-campaign.command';
import { CampaignLedger } from '../domain/model/entities/campaign-ledger.entity';
import { CropCampaign } from '../domain/model/entities/crop-campaign.entity';
import { FieldPlot } from '../domain/model/entities/field-plot.entity';
import { CampaignSummary } from '../domain/model/read-models/campaign-summary';
import { FieldManagementApi } from '../infrastructure/field-management-api';
import { NetworkStatus } from '../infrastructure/offline/network-status';
import {
  ExpenseCommand,
  OfflineExpenseQueue,
} from '../infrastructure/offline/offline-expense-queue';
import { FileDownloader } from '../infrastructure/reports/file-downloader';

/**
 * Plots included in the Seed plan (demo quota until subscriptions are implemented).
 *
 * @remarks
 * The quota belongs to Subscriptions and Payments; with the RESTful API,
 * Field Management asks for it before registering a plot.
 */
export const SEED_PLAN_PLOT_QUOTA = 4;

/** Any of the three expenses of the cost ledger (US-37 to US-39). */
export type RecordExpenseCommand = ExpenseCommand;

/**
 * Commands of a new campaign (US-32 to US-34, US-40).
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

/** Satellite observations of the selected plot and the state of their request. */
interface VegetationState {
  observations: SatelliteObservation[];
  loading: boolean;
  error: boolean;
}

const EMPTY_VEGETATION: VegetationState = { observations: [], loading: false, error: false };

/**
 * Holds the Field Management state and coordinates its application behavior.
 *
 * @remarks
 * It keeps the producer's plots with their campaigns and cost ledgers, and the
 * selected plot. The views send commands and read signals. Every change is
 * applied to a copy of the aggregate; the shown state and the domain events
 * are only updated when the API confirms. It also applies the policies of the
 * context: P3 (link the polygon to AgroMonitoring), P8 (open the cost ledger
 * when a campaign starts) and keeps the expenses recorded offline.
 */
@Injectable({ providedIn: 'root' })
export class FieldManagementStore {
  private readonly fieldManagementApi = inject(FieldManagementApi);
  private readonly demoSession = inject(DemoSessionService);
  private readonly cropHealthApi = inject(CropHealthApi);
  private readonly plotSelection = inject(PlotSelectionService);
  private readonly network = inject(NetworkStatus);
  private readonly offlineQueue = inject(OfflineExpenseQueue);
  private readonly fileDownloader = inject(FileDownloader);

  private readonly plotsSignal = signal<FieldPlot[]>([]);
  private readonly campaignsByPlotSignal = signal<Map<number, CropCampaign[]>>(new Map());
  private readonly ledgersByCampaignSignal = signal<Map<number, CampaignLedger | null>>(new Map());
  private readonly plotsLoadingSignal = signal(false);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly syncingSignal = signal(false);
  private plotsLoad?: Subscription;
  private plotMutation?: Subscription;
  private plotRevision = 0;
  private readonly quotaOwner = signal<number | null>(null);
  private readonly quotaLoaded = signal(false);
  private readonly plotMutationBusy = signal(false);
  private readonly registrationIncompleteSignal = signal(false);
  private ledgersLoad?: Subscription;

  /** Plots of the producer. */
  readonly plots: Signal<FieldPlot[]> = computed<FieldPlot[]>(() =>
    this.plotsSignal().filter((plot) => plot.ownerUserId === this.currentUserId()),
  );

  /** `true` while the plots of the producer are being loaded. */
  readonly plotsLoading = this.plotsLoadingSignal.asReadonly();

  /** `true` while data is being loaded from or saved to the API. */
  readonly loading = this.loadingSignal.asReadonly();

  /** i18n key of the last error, or `null`. */
  readonly error = this.errorSignal.asReadonly();

  /** `true` while the device has connection. */
  readonly online = this.network.online;

  /** Expenses recorded offline that are waiting to be synchronized. */
  readonly pendingExpenseCount = this.offlineQueue.size;

  /** `true` while the offline expenses are being synchronized. */
  readonly syncing = this.syncingSignal.asReadonly();

  /**
   * Producer signed in: the owner of the plots and of the new plots, or `null`.
   * It is the user chosen in the demo access until IAM is implemented; then it
   * comes from IamStore.
   */
  readonly currentUserId = computed(() =>
    this.demoSession.activeUser()?.experience === 'FARMER'
      ? this.demoSession.activeUser()!.id
      : null,
  );

  /** Number of plots of the producer. */
  readonly plotCount = computed(() => this.plots().length);

  /** Plots allowed by the plan of the producer. */
  readonly plotQuota = signal(SEED_PLAN_PLOT_QUOTA).asReadonly();

  /** Quota is known only after a successful read for the currently selected producer. */
  readonly plotQuotaReady = computed(
    () =>
      this.currentUserId() !== null &&
      this.quotaOwner() === this.currentUserId() &&
      this.quotaLoaded() &&
      !this.plotsLoading(),
  );

  /** Remaining slots never become negative, including legacy accounts above the quota. */
  readonly remainingPlotSlots = computed(() => Math.max(0, this.plotQuota() - this.plotCount()));

  /** Indicates an actual full plan, independently of loading or a failed quota check. */
  readonly plotQuotaReached = computed(
    () => this.plotQuotaReady() && this.plotCount() >= this.plotQuota(),
  );

  /** A saved plot whose initial campaign failed must be reviewed before another registration. */
  readonly registrationIncomplete = this.registrationIncompleteSignal.asReadonly();

  /** `true` only when a loaded producer has a free slot and no operation is in flight (US-22). */
  readonly canRegisterPlot = computed(
    () =>
      this.plotQuotaReady() &&
      this.remainingPlotSlots() > 0 &&
      !this.loading() &&
      !this.plotMutationBusy() &&
      !this.registrationIncomplete(),
  );

  /** Plot shown on the dashboard. */
  readonly selectedPlot = computed(() =>
    this.plots().find((plot) => plot.id === this.plotSelection.selectedPlotId()),
  );

  /** Campaigns of the selected plot. */
  readonly campaigns = computed(
    () => this.campaignsByPlotSignal().get(this.plotSelection.selectedPlotId() ?? -1) ?? [],
  );

  /** Campaign in progress of the selected plot, or the most recent one. */
  readonly activeCampaign = computed(() => FieldManagementStore.currentOf(this.campaigns()));

  /** `true` when the selected plot has a campaign in progress. */
  readonly hasCampaignInProgress = computed(() =>
    this.campaigns().some((campaign) => campaign.isActive()),
  );

  /** Cost ledger of the active campaign of the selected plot, or `null`. */
  readonly ledger = computed(() => {
    const campaign = this.activeCampaign();
    return campaign ? (this.ledgersByCampaignSignal().get(campaign.id as number) ?? null) : null;
  });

  /** `CampaignSummary` read model of every campaign of the selected plot, the most recent first. */
  readonly campaignSummaries = computed(() => {
    const plot = this.selectedPlot();
    if (!plot) return [];
    const ledgers = this.ledgersByCampaignSignal();
    return [...this.campaigns()]
      .sort((a, b) => (b.id as number) - (a.id as number))
      .map((campaign) =>
        CampaignSummary.of(campaign, ledgers.get(campaign.id as number) ?? null, plot.areaHectares),
      );
  });

  // NDVI of the selected plot: the observations belong to Crop Health and
  // are read through its API facade, reloading when the selected plot changes.
  private readonly vegetation = toSignal(
    toObservable(this.selectedPlot).pipe(switchMap((plot) => this.loadObservationsOf(plot))),
    { initialValue: EMPTY_VEGETATION },
  );

  /** Satellite observations of the selected plot, oldest first. */
  readonly observations = computed(() => this.vegetation().observations);
  readonly latestObservation = computed(() => this.observations().at(-1));
  readonly observationsLoading = computed(() => this.vegetation().loading);
  readonly observationsError = computed(() => this.vegetation().error);

  /**
   * Creates an instance of FieldManagementStore. It loads the plots of the
   * producer every time the signed-in user changes, and synchronizes the
   * offline expenses every time the connection comes back.
   */
  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearState());
    effect(() => {
      const userId = this.currentUserId();
      untracked(() => (userId === null ? this.clearState() : this.loadMyPlots(userId)));
    });
    effect(() => {
      if (this.network.online() && this.offlineQueue.size() > 0) {
        untracked(() => this.syncPendingExpenses());
      }
    });
  }

  // ---------- Queries ----------

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
   * Selects the campaigns of a plot.
   * @param plotId - Plot identifier.
   */
  getCampaignsOf = (plotId: number): Signal<CropCampaign[]> =>
    computed(() => this.campaignsByPlotSignal().get(plotId) ?? []);

  /**
   * Loads the plots of the producer with their campaigns, and keeps (or selects) the shown plot.
   * @param ownerUserId - Producer who owns the plots.
   */
  loadMyPlots = (ownerUserId: number): void => {
    if (
      ownerUserId !== this.currentUserId() ||
      (this.plotMutationBusy() && this.quotaOwner() === ownerUserId)
    )
      return;
    const revision = ++this.plotRevision;
    this.plotMutation?.unsubscribe();
    this.plotMutationBusy.set(false);
    this.quotaOwner.set(ownerUserId);
    this.quotaLoaded.set(false);
    this.registrationIncompleteSignal.set(false);
    this.plotsLoad?.unsubscribe();
    this.ledgersLoad?.unsubscribe();
    this.plotsLoadingSignal.set(true);
    this.startLoading();
    this.plotsLoad = this.fieldManagementApi
      .getPlotsByOwner(ownerUserId)
      .pipe(
        retry(2),
        map((plots) => this.ownedPlots(plots, ownerUserId)),
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
          if (!this.isPlotParticipant(ownerUserId, revision)) return;
          this.quotaLoaded.set(true);
          this.plotsLoadingSignal.set(false);
          this.plotsSignal.set(plots);
          this.campaignsByPlotSignal.set(
            new Map(plots.map((plot, index) => [plot.id as number, campaigns[index]])),
          );
          this.loadingSignal.set(false);
          const keep = plots.some((plot) => plot.id === this.plotSelection.selectedPlotId());
          const first = plots[0];
          if (first) {
            this.selectPlot(keep ? this.plotSelection.selectedPlotId()! : (first.id as number));
          } else {
            this.plotSelection.select(null);
          }
        },
        error: (error) => {
          if (!this.isPlotParticipant(ownerUserId, revision)) return;
          this.quotaLoaded.set(false);
          this.plotsLoadingSignal.set(false);
          this.fail(error, 'field-management.errors.load-plots');
        },
      });
  };

  /**
   * Selects a plot and loads the cost ledgers of its campaigns.
   * @param plotId - Plot to show.
   */
  selectPlot = (plotId: number): void => {
    if (!this.plots().some((plot) => plot.id === plotId)) return;
    this.ledgersLoad?.unsubscribe();
    this.plotSelection.select(plotId);
    const campaigns = this.campaignsByPlotSignal().get(plotId) ?? [];
    if (campaigns.length === 0) return;
    this.startLoading();
    this.ledgersLoad = forkJoin(
      campaigns.map((campaign) =>
        this.fieldManagementApi.getLedgerByCampaign(campaign.id as number).pipe(retry(2)),
      ),
    ).subscribe({
      next: (ledgers) => {
        this.ledgersByCampaignSignal.update((current) => {
          const next = new Map(current);
          campaigns.forEach((campaign, index) => next.set(campaign.id as number, ledgers[index]));
          return next;
        });
        this.loadingSignal.set(false);
      },
      error: (error) => this.fail(error, 'field-management.errors.load-plot'),
    });
  };

  // ---------- FieldPlot aggregate ----------

  /**
   * Registers a plot "without polygon" with its first campaign and its cost ledger (US-28, US-32 to US-36).
   * @remarks Rechecks the owner-scoped quota before POST and serializes local mutations.
   * The backend must enforce the quota atomically across browsers and clients.
   * @param command - Owner, name, region and declared area of the plot.
   * @param setup - Commands of the first campaign.
   * @param onRegistered - Called with the new plot, to continue with its polygon.
   */
  registerPlot = (
    command: RegisterFieldPlotCommand,
    setup: CropCampaignSetup,
    onRegistered?: (plot: FieldPlot) => void,
  ): void => {
    if (this.plotMutationBusy()) return;
    const ownerUserId = this.currentUserId();
    if (ownerUserId === null || command.ownerUserId !== ownerUserId) {
      this.errorSignal.set('field-management.errors.plot-not-owned');
      return;
    }
    if (!this.canRegisterPlot()) {
      this.errorSignal.set(
        this.plotQuotaReached()
          ? 'field-management.errors.quota-reached'
          : 'field-management.errors.quota-unavailable',
      );
      return;
    }
    let plot: FieldPlot;
    try {
      plot = FieldPlot.register(command);
    } catch (error) {
      this.fail(error, 'field-management.errors.register-plot');
      return;
    }
    const revision = this.plotRevision;
    let created = false;
    let quotaChecked = false;
    let creationStarted = false;
    this.plotMutationBusy.set(true);
    this.startLoading();
    this.plotMutation = this.fieldManagementApi
      .getPlotsByOwner(ownerUserId)
      .pipe(
        switchMap((records) => {
          if (!this.isPlotParticipant(ownerUserId, revision))
            return throwError(() => new Error('field-management.errors.plot-not-owned'));
          const owned = this.ownedPlots(records, ownerUserId);
          this.plotsSignal.set(owned);
          quotaChecked = true;
          if (owned.length >= this.plotQuota())
            return throwError(() => new Error('field-management.errors.quota-reached'));
          creationStarted = true;
          return this.fieldManagementApi.createPlot(plot);
        }),
        tap((createdPlot) => {
          if (
            !this.isPlotParticipant(ownerUserId, revision) ||
            createdPlot.ownerUserId !== ownerUserId
          )
            throw new Error('field-management.errors.plot-not-owned');
          created = true;
          // The slot is consumed as soon as the plot exists, even if its campaign later fails.
          this.plotsSignal.update((plots) => [
            ...plots.filter((item) => item.id !== createdPlot.id),
            createdPlot,
          ]);
          this.campaignsByPlotSignal.update((campaigns) =>
            new Map(campaigns).set(createdPlot.id as number, []),
          );
        }),
        switchMap((createdPlot) =>
          this.createCampaignWithLedger(createdPlot.id as number, setup, []).pipe(
            map((result) => ({ createdPlot, ...result })),
          ),
        ),
      )
      .subscribe({
        next: ({ createdPlot, campaign, ledger }) => {
          if (!this.isPlotParticipant(ownerUserId, revision)) return;
          this.campaignsByPlotSignal.update((campaigns) =>
            new Map(campaigns).set(createdPlot.id as number, [campaign]),
          );
          this.setLedger(campaign.id as number, ledger);
          this.plotMutationBusy.set(false);
          this.loadingSignal.set(false);
          this.selectPlot(createdPlot.id as number);
          onRegistered?.(createdPlot);
        },
        error: (error) => {
          if (!this.isPlotParticipant(ownerUserId, revision)) return;
          this.plotMutationBusy.set(false);
          this.registrationIncompleteSignal.set(created);
          // A lost POST response leaves an unknown count: refresh before attempting another write.
          if (!quotaChecked || (creationStarted && !created)) this.quotaLoaded.set(false);
          const key = created
            ? 'field-management.errors.registration-partial'
            : error instanceof Error && error.message.startsWith('field-management.errors.')
              ? error.message
              : creationStarted
                ? 'field-management.errors.registration-unconfirmed'
                : 'field-management.errors.quota-check';
          this.fail(error, key);
        },
      });
  };

  /**
   * Saves the GPS polygon of a plot and its area (US-29), and links it to
   * AgroMonitoring so the satellite monitoring starts (policy P3, US-30).
   * @param command - Plot and vertices of the polygon.
   * @param onDelineated - Called with the saved plot.
   */
  delineateBoundary = (
    command: DelineatePlotBoundaryCommand,
    onDelineated?: (plot: FieldPlot) => void,
  ): void => {
    const current = this.findPlot(command.plotId);
    if (!current) return;
    const plot = current.clone();
    try {
      plot.delineateBoundary(command.coordinates);
    } catch (error) {
      this.fail(error, 'field-management.errors.invalid-polygon');
      return;
    }
    this.startLoading();
    // Policy P3: Whenever PlotBoundaryDelineated Then LinkPlotPolygon.
    this.fieldManagementApi
      .registerPolygonInAgroMonitoring(plot)
      .pipe(
        map((agroMonitoringPolygonId) => {
          plot.linkPolygon(agroMonitoringPolygonId);
        }),
        switchMap(() => this.fieldManagementApi.updateBoundary(plot).pipe(retry(2))),
      )
      .subscribe({
        next: (updated) => {
          this.replacePlot(updated);
          this.loadingSignal.set(false);
          onDelineated?.(updated);
        },
        error: (error) => this.fail(error, 'field-management.errors.save-polygon'),
      });
  };

  /**
   * Links (again) the polygon of a plot to AgroMonitoring.
   * @param command - Plot and polygon identifier in AgroMonitoring.
   */
  linkPlotPolygon = (command: LinkPlotPolygonCommand): void => {
    this.savePlot(
      command.plotId,
      (plot) => plot.linkPolygon(command.agroMonitoringPolygonId),
      'field-management.errors.save-polygon',
    );
  };

  /**
   * Records the initial soil analysis of a plot.
   * @param command - pH, texture, organic matter and date of the analysis.
   * @param onRecorded - Called after the API confirms.
   */
  recordSoilBaseline = (command: RecordSoilBaselineCommand, onRecorded?: () => void): void => {
    this.savePlot(
      command.plotId,
      (plot) => plot.recordSoilBaseline(command),
      'field-management.errors.save-soil',
      onRecorded,
    );
  };

  /**
   * Deletes a plot by ID.
   * @param id - The ID of the plot to delete.
   */
  deletePlot = (id: number): void => {
    if (this.plotMutationBusy() || this.loading()) return;
    const ownerUserId = this.currentUserId();
    const plot = this.findPlot(id);
    if (
      ownerUserId === null ||
      !this.plotQuotaReady() ||
      !plot ||
      plot.ownerUserId !== ownerUserId
    ) {
      this.errorSignal.set('field-management.errors.plot-not-owned');
      return;
    }
    const revision = this.plotRevision;
    this.plotMutationBusy.set(true);
    this.startLoading();
    this.plotMutation = this.fieldManagementApi
      .getPlotById(id)
      .pipe(
        switchMap((current) => {
          if (
            !this.isPlotParticipant(ownerUserId, revision) ||
            current.id !== id ||
            current.ownerUserId !== ownerUserId
          )
            return throwError(() => new Error('field-management.errors.plot-not-owned'));
          return this.fieldManagementApi.deletePlot(id);
        }),
      )
      .subscribe({
        next: () => {
          if (!this.isPlotParticipant(ownerUserId, revision)) return;
          this.plotsSignal.update((plots) => plots.filter((plot) => plot.id !== id));
          this.campaignsByPlotSignal.update((campaigns) => {
            const next = new Map(campaigns);
            next.delete(id);
            return next;
          });
          this.plotMutationBusy.set(false);
          this.loadingSignal.set(false);
          if (this.plotSelection.selectedPlotId() === id) {
            this.plotSelection.select(null);
            const first = this.plots()[0];
            if (first) this.selectPlot(first.id as number);
          }
        },
        error: (error) => {
          if (!this.isPlotParticipant(ownerUserId, revision)) return;
          this.plotMutationBusy.set(false);
          // Failed or ambiguous deletion never frees a local slot without confirmation.
          this.fail(
            error,
            error instanceof Error && error.message === 'field-management.errors.plot-not-owned'
              ? error.message
              : 'field-management.errors.delete-plot',
          );
        },
      });
  };

  // ---------- CropCampaign aggregate ----------

  /**
   * Starts a new campaign on a plot whose previous campaign is closed, and
   * opens its cost ledger (policy P8).
   * @param setup - Commands of the new campaign.
   * @param onStarted - Called with the new campaign.
   */
  startCampaign = (
    setup: CropCampaignSetup,
    onStarted?: (campaign: CropCampaign) => void,
  ): void => {
    const plotId = setup.start.plotId;
    if (!this.findPlot(plotId)) return;
    this.startLoading();
    this.createCampaignWithLedger(
      plotId,
      setup,
      this.campaignsByPlotSignal().get(plotId) ?? [],
    ).subscribe({
      next: ({ campaign, ledger }) => {
        this.campaignsByPlotSignal.update((campaigns) =>
          new Map(campaigns).set(plotId, [...(campaigns.get(plotId) ?? []), campaign]),
        );
        this.setLedger(campaign.id as number, ledger);
        this.loadingSignal.set(false);
        onStarted?.(campaign);
      },
      error: (error) => this.fail(error, 'field-management.errors.start-campaign'),
    });
  };

  /**
   * Closes a campaign and freezes its cost ledger. When the producer knows
   * the harvest, it also records the actual yield.
   * @param command - Campaign to close.
   * @param actualYield - Harvested yield, if known.
   * @param onClosed - Called after the API confirms.
   */
  closeCampaign = (
    command: CloseCropCampaignCommand,
    actualYield?: RecordActualYieldCommand,
    onClosed?: () => void,
  ): void => {
    const current = this.findCampaign(command.campaignId);
    if (!current) return;
    const campaign = current.clone();
    const currentLedger = this.ledgersByCampaignSignal().get(command.campaignId) ?? null;
    const ledger = currentLedger?.clone() ?? null;
    try {
      campaign.close();
      if (ledger && actualYield)
        ledger.recordActualYield(actualYield.actualYield, actualYield.unit);
      ledger?.freeze();
    } catch (error) {
      this.fail(error, 'field-management.errors.close-campaign');
      return;
    }
    this.startLoading();
    this.fieldManagementApi
      .updateCampaign(campaign)
      .pipe(
        retry(2),
        switchMap((savedCampaign) => {
          const saveLedger: Observable<CampaignLedger | null> = ledger
            ? this.fieldManagementApi.updateLedger(ledger).pipe(retry(2))
            : of(null);
          return saveLedger.pipe(map((savedLedger) => ({ savedCampaign, savedLedger })));
        }),
      )
      .subscribe({
        next: ({ savedCampaign, savedLedger }) => {
          this.replaceCampaign(savedCampaign);
          if (savedLedger) this.setLedger(savedCampaign.id as number, savedLedger);
          this.loadingSignal.set(false);
          onClosed?.();
        },
        error: (error) => this.fail(error, 'field-management.errors.close-campaign'),
      });
  };

  // ---------- CampaignLedger aggregate ----------

  /**
   * Adds an expense to the ledger of the active campaign (US-37 to US-39).
   *
   * @remarks
   * Without connection the expense is kept on the device and shown at once;
   * it is synchronized when the connection comes back.
   */
  recordExpense = (command: RecordExpenseCommand, onRecorded?: () => void): void => {
    if (!this.network.online()) {
      this.recordOffline(command, onRecorded);
      return;
    }
    this.saveLedger(
      command.ledgerId,
      (ledger) => FieldManagementStore.applyExpense(ledger, command),
      'field-management.errors.record-expense',
      onRecorded,
      () => this.recordOffline(command, onRecorded),
    );
  };

  /** Changes the expected yield, which updates the breakeven price (US-40). */
  setExpectedYield = (command: SetExpectedYieldCommand): void => {
    this.saveLedger(
      command.ledgerId,
      (ledger) => ledger.setExpectedYield(command.expectedYield, command.unit),
      'field-management.errors.save-yield',
    );
  };

  /**
   * Records the harvested yield (policy P10); the breakeven price then uses it.
   * @param command - Ledger, yield and unit.
   * @param onRecorded - Called after the API confirms.
   */
  recordActualYield = (command: RecordActualYieldCommand, onRecorded?: () => void): void => {
    this.saveLedger(
      command.ledgerId,
      (ledger) => ledger.recordActualYield(command.actualYield, command.unit),
      'field-management.errors.save-actual-yield',
      onRecorded,
    );
  };

  /**
   * Builds the cost report of a campaign and downloads it.
   * @param command - Campaign of the report.
   */
  exportCostReport = (command: ExportCampaignCostReportCommand): void => {
    const campaign = this.findCampaign(command.campaignId);
    const plot = campaign ? this.findPlot(campaign.plotId) : undefined;
    const ledger = this.ledgersByCampaignSignal().get(command.campaignId)?.clone();
    if (!campaign || !plot || !ledger) {
      this.errorSignal.set('field-management.errors.export-report');
      return;
    }
    this.fieldManagementApi.exportCostReport(plot, campaign, ledger).subscribe({
      next: (file) => {
        this.fileDownloader.save(file);
      },
      error: (error) => this.fail(error, 'field-management.errors.export-report'),
    });
  };

  /**
   * Sends the expenses recorded offline to the API, ledger by ledger.
   * The ledger ignores the expenses that were already saved.
   */
  syncPendingExpenses = (): void => {
    if (this.syncingSignal() || !this.network.online()) return;
    const ledgerIds = this.offlineQueue.pendingLedgerIds();
    if (ledgerIds.length === 0) return;
    this.syncingSignal.set(true);
    from(ledgerIds)
      .pipe(
        concatMap((ledgerId) => {
          const commands = this.offlineQueue.pendingOf(ledgerId);
          return this.fieldManagementApi.getLedgerById(ledgerId).pipe(
            switchMap((saved) => {
              const ledger = saved.clone();
              commands.forEach((command) => FieldManagementStore.applyExpense(ledger, command));
              return this.fieldManagementApi
                .updateLedger(ledger)
                .pipe(map((updated) => ({ updated, commands })));
            }),
            // A ledger that fails (for example, it was deleted) does not stop the others.
            catchError((error) => {
              console.error(error);
              return of(null);
            }),
          );
        }),
      )
      .subscribe({
        next: (result) => {
          if (!result) return;
          this.offlineQueue.remove(result.commands.map((command) => command.clientSyncId));
          this.setLedger(result.updated.campaignId, result.updated);
        },
        complete: () => this.syncingSignal.set(false),
      });
  };

  // ---------- Helpers ----------

  /**
   * Starts a campaign, applies its setup commands and opens its ledger (policy P8).
   *
   * @remarks
   * With the RESTful API the backend opens the ledger when it receives
   * `CropCampaignStarted`; with the fake API the store creates it.
   */
  private createCampaignWithLedger(
    plotId: number,
    setup: CropCampaignSetup,
    plotCampaigns: CropCampaign[],
  ): Observable<{
    campaign: CropCampaign;
    ledger: CampaignLedger;
  }> {
    let campaign: CropCampaign;
    try {
      campaign = CropCampaign.start(
        new StartCropCampaignCommand({ plotId, season: setup.start.season }),
        plotCampaigns,
      );
      campaign.selectCropType(setup.cropType.cropType);
      campaign.specifySeedVariety(setup.seedVariety.varietyName, setup.seedVariety.custom);
      campaign.recordSowingDate(setup.sowingDate.sowingDate);
    } catch (error) {
      return throwError(() => error);
    }
    return this.fieldManagementApi.createCampaign(campaign).pipe(
      switchMap((created) => {
        // Policy P8: Whenever CropCampaignStarted Then OpenCampaignLedger.
        const ledger = CampaignLedger.open(
          new OpenCampaignLedgerCommand({
            campaignId: created.id as number,
            yieldUnit: CampaignLedger.yieldUnitOf(created.cropType),
          }),
        );
        try {
          if (setup.expectedYield) {
            ledger.setExpectedYield(setup.expectedYield.expectedYield, ledger.yieldUnit);
          }
        } catch (error) {
          return throwError(() => error);
        }
        return this.fieldManagementApi.createLedger(ledger).pipe(
          map((createdLedger) => ({ campaign: created, ledger: createdLedger })),
        );
      }),
    );
  }

  /**
   * Applies a change to a copy of a plot and saves it; the shown plot only
   * changes when the API confirms.
   */
  private savePlot(
    plotId: number,
    change: (plot: FieldPlot) => void,
    errorKey: string,
    onSaved?: () => void,
  ): void {
    const current = this.findPlot(plotId);
    if (!current) return;
    const plot = current.clone();
    try {
      change(plot);
    } catch (error) {
      this.fail(error, errorKey);
      return;
    }
    this.startLoading();
    this.fieldManagementApi
      .updatePlot(plot)
      .pipe(retry(2))
      .subscribe({
        next: (saved) => {
          this.replacePlot(saved);
          this.loadingSignal.set(false);
          onSaved?.();
        },
        error: (error) => this.fail(error, errorKey),
      });
  }

  /**
   * Applies a change to a copy of a ledger and saves it; the shown ledger
   * only changes when the API confirms.
   * @param onOffline - Called instead of failing when the connection was lost.
   */
  private saveLedger(
    ledgerId: number,
    change: (ledger: CampaignLedger) => void,
    errorKey: string,
    onSaved?: () => void,
    onOffline?: () => void,
  ): void {
    const current = this.findLedger(ledgerId);
    if (!current) return;
    const ledger = current.clone();
    try {
      change(ledger);
    } catch (error) {
      this.fail(error, errorKey);
      return;
    }
    this.startLoading();
    this.fieldManagementApi
      .updateLedger(ledger)
      .pipe(retry(2))
      .subscribe({
        next: (saved) => {
          this.setLedger(saved.campaignId, saved);
          this.loadingSignal.set(false);
          onSaved?.();
        },
        error: (error) => {
          if (onOffline && !this.network.online()) {
            this.loadingSignal.set(false);
            onOffline();
            return;
          }
          this.fail(error, errorKey);
        },
      });
  }

  /** Keeps the expense on the device and shows it in the ledger until it is synchronized. */
  private recordOffline(command: RecordExpenseCommand, onRecorded?: () => void): void {
    const current = this.findLedger(command.ledgerId);
    if (!current) return;
    const ledger = current.clone();
    try {
      FieldManagementStore.applyExpense(ledger, command);
    } catch (error) {
      this.fail(error, 'field-management.errors.record-expense');
      return;
    }
    this.offlineQueue.enqueue(command);
    this.setLedger(ledger.campaignId, ledger);
    this.errorSignal.set(null);
    onRecorded?.();
  }

  private findPlot(plotId: number): FieldPlot | undefined {
    return this.plots().find((plot) => plot.id === plotId);
  }

  private findCampaign(campaignId: number): CropCampaign | undefined {
    for (const campaigns of this.campaignsByPlotSignal().values()) {
      const campaign = campaigns.find((item) => item.id === campaignId);
      if (campaign) return campaign;
    }
    return undefined;
  }

  private findLedger(ledgerId: number): CampaignLedger | undefined {
    for (const ledger of this.ledgersByCampaignSignal().values()) {
      if (ledger?.id === ledgerId) return ledger;
    }
    return undefined;
  }

  private replacePlot(plot: FieldPlot): void {
    this.plotsSignal.update((plots) => plots.map((item) => (item.id === plot.id ? plot : item)));
  }

  private replaceCampaign(campaign: CropCampaign): void {
    this.campaignsByPlotSignal.update((current) => {
      const campaigns = (current.get(campaign.plotId) ?? []).map((item) =>
        item.id === campaign.id ? campaign : item,
      );
      return new Map(current).set(campaign.plotId, campaigns);
    });
  }

  private setLedger(campaignId: number, ledger: CampaignLedger | null): void {
    this.ledgersByCampaignSignal.update((ledgers) => new Map(ledgers).set(campaignId, ledger));
  }

  /** A plot without polygon has no satellite observations yet. */
  private loadObservationsOf(plot: FieldPlot | undefined): Observable<VegetationState> {
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
  }

  /** Forgets the plots of the previous user (after signing out). */
  private clearState(): void {
    this.plotRevision++;
    this.plotMutation?.unsubscribe();
    this.plotMutationBusy.set(false);
    this.quotaLoaded.set(false);
    this.quotaOwner.set(null);
    this.registrationIncompleteSignal.set(false);
    this.plotsLoadingSignal.set(false);
    this.plotsLoad?.unsubscribe();
    this.ledgersLoad?.unsubscribe();
    this.loadingSignal.set(false);
    this.plotsSignal.set([]);
    this.campaignsByPlotSignal.set(new Map());
    this.ledgersByCampaignSignal.set(new Map());
    this.plotSelection.select(null);
    this.errorSignal.set(null);
  }

  /** Keeps quota counts account-scoped even if a demo endpoint returns unrelated rows. */
  private ownedPlots(plots: FieldPlot[], ownerUserId: number): FieldPlot[] {
    return [
      ...new Map(
        plots.filter((plot) => plot.ownerUserId === ownerUserId).map((plot) => [plot.id, plot]),
      ).values(),
    ];
  }

  /** Rejects delayed responses from a previous account or an obsolete quota snapshot. */
  private isPlotParticipant(ownerUserId: number, revision: number): boolean {
    return this.currentUserId() === ownerUserId && this.plotRevision === revision;
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

  /** Sends an expense command to the method of the ledger that handles it. */
  private static applyExpense(ledger: CampaignLedger, command: RecordExpenseCommand): void {
    if (command instanceof RecordInputExpenseCommand) ledger.recordInputExpense(command);
    else if (command instanceof RecordDailyLaborExpenseCommand)
      ledger.recordDailyLaborExpense(command);
    else ledger.recordFieldFreightExpense(command);
  }

  /** Campaign in progress, or the most recent one. */
  private static currentOf(campaigns: CropCampaign[]): CropCampaign | undefined {
    return campaigns.find((campaign) => campaign.isActive()) ?? campaigns.at(-1);
  }
}
