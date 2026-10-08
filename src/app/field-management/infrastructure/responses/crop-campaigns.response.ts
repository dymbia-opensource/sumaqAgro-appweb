import { BaseResponse } from '../../../shared/infrastructure/base-response';
import { CropCampaignResource } from './crop-campaign.response';

/**
 * Response envelope for crop campaign collection queries.
 */
export interface CropCampaignsResponse extends BaseResponse {
  /** Crop campaign resources included in the response. */
  campaigns: CropCampaignResource[];
}
