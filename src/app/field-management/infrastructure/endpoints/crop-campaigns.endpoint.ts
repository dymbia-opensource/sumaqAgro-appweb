import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { CropCampaign } from '../../domain/model/entities/crop-campaign.entity';
import { CropCampaignAssembler } from '../assemblers/crop-campaign.assembler';
import { CropCampaignResource, CropCampaignsResponse } from '../responses/crop-campaign.response';

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
    const params = new HttpParams().set('plotId', plotId);
    return this.http
      .get<CropCampaignsResponse | CropCampaignResource[]>(this.endpointUrl, { params })
      .pipe(
        map((response) => this.toEntities(response)),
        catchError(this.handleError('Failed to fetch the campaigns of the plot')),
      );
  }
}
