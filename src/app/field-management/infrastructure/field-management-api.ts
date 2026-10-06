import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { CampaignLedger } from '../domain/model/entities/campaign-ledger.entity';
import { CropCampaign } from '../domain/model/entities/crop-campaign.entity';
import { FieldPlot } from '../domain/model/entities/field-plot.entity';
import { CampaignLedgersApiEndpoint } from './endpoints/campaign-ledgers.endpoint';
import { CropCampaignsApiEndpoint } from './endpoints/crop-campaigns.endpoint';
import { FieldPlotsApiEndpoint } from './endpoints/field-plots.endpoint';

/**
 * Facade of the Field Management infrastructure.
 *
 * @remarks
 * It groups the plots, campaigns and cost ledgers endpoints, so the
 * application layer only depends on this class.
 */
@Service()
export class FieldManagementApi extends BaseApi {
  private readonly fieldPlotsEndpoint: FieldPlotsApiEndpoint;
  private readonly cropCampaignsEndpoint: CropCampaignsApiEndpoint;
  private readonly campaignLedgersEndpoint: CampaignLedgersApiEndpoint;

  constructor() {
    super();
    const http = inject(HttpClient);
    this.fieldPlotsEndpoint = new FieldPlotsApiEndpoint(http);
    this.cropCampaignsEndpoint = new CropCampaignsApiEndpoint(http);
    this.campaignLedgersEndpoint = new CampaignLedgersApiEndpoint(http);
  }

  // ---------- Field plots ----------

  /** Loads the plots of one producer. */
  getPlotsByOwner(ownerUserId: number): Observable<FieldPlot[]> {
    return this.fieldPlotsEndpoint.getByOwner(ownerUserId);
  }

  /** Loads one plot. */
  getPlot(plotId: number): Observable<FieldPlot> {
    return this.fieldPlotsEndpoint.getById(plotId);
  }

  /** Registers a new plot. */
  createPlot(plot: FieldPlot): Observable<FieldPlot> {
    return this.fieldPlotsEndpoint.create(plot);
  }

  /** Saves the changes of a plot (for example, its polygon). */
  updatePlot(plot: FieldPlot): Observable<FieldPlot> {
    return this.fieldPlotsEndpoint.update(plot, plot.id);
  }

  // ---------- Crop campaigns ----------

  /** Loads the campaigns of one plot. */
  getCampaignsByPlot(plotId: number): Observable<CropCampaign[]> {
    return this.cropCampaignsEndpoint.getByPlot(plotId);
  }

  /** Starts a new campaign. */
  createCampaign(campaign: CropCampaign): Observable<CropCampaign> {
    return this.cropCampaignsEndpoint.create(campaign);
  }

  /** Saves the changes of a campaign. */
  updateCampaign(campaign: CropCampaign): Observable<CropCampaign> {
    return this.cropCampaignsEndpoint.update(campaign, campaign.id);
  }

  // ---------- Cost ledgers ----------

  /** Loads the cost ledger of one campaign, or `null` if it has none. */
  getLedgerByCampaign(campaignId: number): Observable<CampaignLedger | null> {
    return this.campaignLedgersEndpoint.getByCampaign(campaignId);
  }

  /** Opens the cost ledger of a campaign. */
  createLedger(ledger: CampaignLedger): Observable<CampaignLedger> {
    return this.campaignLedgersEndpoint.create(ledger);
  }

  /** Saves the ledger with its expenses and expected yield. */
  updateLedger(ledger: CampaignLedger): Observable<CampaignLedger> {
    return this.campaignLedgersEndpoint.update(ledger, ledger.id);
  }
}
