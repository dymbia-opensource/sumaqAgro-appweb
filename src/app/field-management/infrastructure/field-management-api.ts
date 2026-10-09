import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { CampaignLedger } from '../domain/model/entities/campaign-ledger.entity';
import { CropCampaign } from '../domain/model/entities/crop-campaign.entity';
import { FieldPlot } from '../domain/model/entities/field-plot.entity';
import { CampaignLedgersApiEndpoint } from './endpoints/campaign-ledgers.endpoint';
import { CropCampaignsApiEndpoint } from './endpoints/crop-campaigns.endpoint';
import { FieldPlotsApiEndpoint } from './endpoints/field-plots.endpoint';

/**
 * Infrastructure facade for the field plot, crop campaign and cost ledger endpoints.
 *
 * @remarks
 * The application layer only depends on this class, never on the endpoints.
 */
@Injectable({ providedIn: 'root' })
export class FieldManagementApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly plotsEndpoint = new FieldPlotsApiEndpoint(this.http);
  private readonly campaignsEndpoint = new CropCampaignsApiEndpoint(this.http);
  private readonly ledgersEndpoint = new CampaignLedgersApiEndpoint(this.http);

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
   * Deletes a plot by ID.
   * @param id - The ID of the plot to delete.
   * @returns An Observable of void.
   */
  deletePlot = (id: number): Observable<void> => this.plotsEndpoint.delete(id);

  /** Loads a canonical plot referenced by a cooperative membership. */
  getPlotById = (id: number): Observable<FieldPlot> => this.plotsEndpoint.getById(id);

  /** Ignores stale membership references to plots that have been deleted. */
  getPlotsByIds = (ids: number[]): Observable<FieldPlot[]> =>
    this.plotsEndpoint.getAll().pipe(map(plots => plots.filter(plot => ids.includes(plot.id as number))));

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
}
