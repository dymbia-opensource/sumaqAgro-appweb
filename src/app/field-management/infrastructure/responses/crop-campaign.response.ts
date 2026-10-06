import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/** Crop campaign as the RESTful API sends it. */
export interface CropCampaignResource extends BaseResource {
  id: number;
  plotId: number;
  season: string;
  cropType: string;
  seedVariety: string;
  /** Date in `YYYY-MM-DD` format, or `null` if the crop is not sown yet. */
  sowingDate: string | null;
  status: string;
}

/** Response that wraps a list of crop campaigns. */
export interface CropCampaignsResponse extends BaseResponse {
  campaigns: CropCampaignResource[];
}
