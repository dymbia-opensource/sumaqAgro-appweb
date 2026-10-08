import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { CropCampaign } from '../../domain/model/entities/crop-campaign.entity';
import { CropCampaignAssembler } from '../assemblers/crop-campaign.assembler';
import { CropCampaignResource } from '../responses/crop-campaign.response';
import { CropCampaignsResponse } from '../responses/crop-campaigns.response';

/** HTTP endpoint for the crop campaigns resource (`/crop-campaigns`). */
export class CropCampaignsApiEndpoint extends BaseApiEndpoint<
  CropCampaign,
  CropCampaignResource,
  CropCampaignsResponse,
  CropCampaignAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderCropCampaignsEndpointPath}`,
      new CropCampaignAssembler(),
    );
  }

  /**
   * Loads the campaigns of one plot.
   * @param plotId - Plot where the campaigns take place.
   */
  getByPlot(plotId: number): Observable<CropCampaign[]> {
    return this.getAllBy({ plotId }, 'Failed to fetch the campaigns of the plot');
  }
}
