import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { concatMap, from, map, Observable, of, switchMap, toArray } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { CampaignLedger } from '../domain/model/entities/campaign-ledger.entity';
import { CropCampaign } from '../domain/model/entities/crop-campaign.entity';
import { FieldPlot } from '../domain/model/entities/field-plot.entity';
import { AgroMonitoringPolygonsClient } from './agromonitoring/agro-monitoring-polygons.client';
import { CampaignLedgersApiEndpoint } from './endpoints/campaign-ledgers.endpoint';
import { CropCampaignsApiEndpoint } from './endpoints/crop-campaigns.endpoint';
import { FieldPlotsApiEndpoint } from './endpoints/field-plots.endpoint';
import { CampaignCostReportExporter, ExportedFile } from './reports/campaign-cost-report.exporter';

/**
 * Infrastructure facade for the field plot, crop campaign and cost ledger endpoints.
 *
 * @remarks
 * The application layer only depends on this class, never on the endpoints,
 * the AgroMonitoring client or the report exporter.
 */
@Injectable({ providedIn: 'root' })
export class FieldManagementApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly plotsEndpoint = new FieldPlotsApiEndpoint(this.http);
  private readonly campaignsEndpoint = new CropCampaignsApiEndpoint(this.http);
  private readonly ledgersEndpoint = new CampaignLedgersApiEndpoint(this.http);
  private readonly agroMonitoring = new AgroMonitoringPolygonsClient();
  private readonly costReportExporter = new CampaignCostReportExporter();

  // ---------- Field plots ----------

  /**
   * Retrieves the plots of one producer.
   * @param ownerUserId - Producer who owns the plots.
   * @returns Stream with the plot collection.
   */
  getPlotsByOwner = (ownerUserId: number): Observable<FieldPlot[]> =>
    this.plotsEndpoint.getByOwner(ownerUserId);

  /**
   * Creates a new plot.
   * @param plot - The plot to create.
   * @returns An Observable of the created FieldPlot object.
   */
  createPlot = (plot: FieldPlot): Observable<FieldPlot> => this.plotsEndpoint.create(plot);

  /**
   * Saves the GPS polygon (and the area) of a plot.
   * @param plot - The plot with its new polygon.
   * @returns An Observable of the updated FieldPlot object.
   */
  updateBoundary = (plot: FieldPlot): Observable<FieldPlot> =>
    this.plotsEndpoint.update(plot, plot.id);

  /**
   * Saves a plot (for example, with its new soil analysis).
   * @param plot - The plot to save.
   * @returns An Observable of the updated FieldPlot object.
   */
  updatePlot = (plot: FieldPlot): Observable<FieldPlot> => this.plotsEndpoint.update(plot, plot.id);

  /**
   * Registers the polygon of a plot in AgroMonitoring (policy P3).
   * @param plot - Plot with its GPS polygon.
   * @returns The polygon identifier in AgroMonitoring.
   */
  registerPolygonInAgroMonitoring = (plot: FieldPlot): Observable<string> =>
    this.agroMonitoring.registerPolygon(plot);

  /**
   * Deletes a plot by ID, with its campaigns and cost ledgers.
   * @param id - The ID of the plot to delete.
   * @returns An Observable of void.
   */
  deletePlot = (id: number): Observable<void> =>
    this.campaignsEndpoint.getByPlot(id).pipe(
      // One request at a time: json-server rewrites its file on every change.
      switchMap((campaigns) => from(campaigns)),
      concatMap((campaign) => this.deleteCampaign(campaign.id as number)),
      toArray(),
      switchMap(() => this.plotsEndpoint.delete(id)),
    );

  /**
   * Deletes a campaign with its cost ledger.
   *
   * @remarks
   * The RESTful API deletes them in cascade with the plot; the fake API does
   * not, so the facade does it to avoid orphan campaigns.
   */
  private deleteCampaign = (campaignId: number): Observable<void> =>
    this.ledgersEndpoint.getByCampaign(campaignId).pipe(
      switchMap((ledger) => (ledger ? this.ledgersEndpoint.delete(ledger.id) : of(undefined))),
      switchMap(() => this.campaignsEndpoint.delete(campaignId)),
    );

  /** Loads a canonical plot referenced by a cooperative membership. */
  getPlotById = (id: number): Observable<FieldPlot> => this.plotsEndpoint.getById(id);

  /** Ignores stale membership references to plots that have been deleted. */
  getPlotsByIds = (ids: number[]): Observable<FieldPlot[]> =>
    this.plotsEndpoint
      .getAll()
      .pipe(map((plots) => plots.filter((plot) => ids.includes(plot.id as number))));

  /** Loads the canonical campaign before validating ownership of a queued expense. */
  getCampaignById = (id: number): Observable<CropCampaign> => this.campaignsEndpoint.getById(id);

  // ---------- Crop campaigns ----------

  /**
   * Retrieves the campaigns of one plot.
   * @param plotId - Plot where the campaigns take place.
   * @returns Stream with the campaign collection.
   */
  getCampaignsByPlot = (plotId: number): Observable<CropCampaign[]> =>
    this.campaignsEndpoint.getByPlot(plotId);

  /**
   * Creates a new campaign.
   * @param campaign - The campaign to create.
   * @returns An Observable of the created CropCampaign object.
   */
  createCampaign = (campaign: CropCampaign): Observable<CropCampaign> =>
    this.campaignsEndpoint.create(campaign);

  /**
   * Updates an existing campaign.
   * @param campaign - The campaign to update.
   * @returns An Observable of the updated CropCampaign object.
   */
  updateCampaign = (campaign: CropCampaign): Observable<CropCampaign> =>
    this.campaignsEndpoint.update(campaign, campaign.id);

  // ---------- Cost ledgers ----------

  /**
   * Retrieves the cost ledger of one campaign.
   * @param campaignId - Campaign of the ledger.
   * @returns An Observable of the ledger, or `null` if the campaign has none.
   */
  getLedgerByCampaign = (campaignId: number): Observable<CampaignLedger | null> =>
    this.ledgersEndpoint.getByCampaign(campaignId);

  /**
   * Retrieves a cost ledger by ID (used to synchronize the offline expenses).
   * @param id - Ledger identifier.
   */
  getLedgerById = (id: number): Observable<CampaignLedger> => this.ledgersEndpoint.getById(id);

  /**
   * Creates the cost ledger of a campaign.
   * @param ledger - The ledger to create.
   * @returns An Observable of the created CampaignLedger object.
   */
  createLedger = (ledger: CampaignLedger): Observable<CampaignLedger> =>
    this.ledgersEndpoint.create(ledger);

  /**
   * Saves a ledger with its expenses and expected yield.
   * @param ledger - The ledger to save.
   * @returns An Observable of the updated CampaignLedger object.
   */
  updateLedger = (ledger: CampaignLedger): Observable<CampaignLedger> =>
    this.ledgersEndpoint.update(ledger, ledger.id);

  /**
   * Builds the cost report of a campaign.
   *
   * @remarks
   * With the RESTful API this becomes `GET /campaign-ledgers/{id}/report` (PDF).
   *
   * @returns An Observable of the report file.
   */
  exportCostReport = (
    plot: FieldPlot,
    campaign: CropCampaign,
    ledger: CampaignLedger,
  ): Observable<ExportedFile> => of(this.costReportExporter.export(plot, campaign, ledger));
}
