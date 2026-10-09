import { BaseResource } from '../../../shared/infrastructure/base-response';

/**
 * Resource representation of a crop campaign.
 */
export interface CropCampaignResource extends BaseResource {
  /** Unique identifier of the campaign. */
  id: number;
  /** Plot where the campaign takes place. */
  plotId: number;
  /** Agricultural season (for example, `2026-I`). */
  season: string;
  /** Crop (`ANDEAN_POTATO` or `SPECIALTY_COFFEE`). */
  cropType: string;
  /** Seed variety sown. */
  seedVariety: string;
  /** Date in `YYYY-MM-DD` format, or `null` if the crop is not sown yet. */
  sowingDate: string | null;
  /** Status (`IN_PROGRESS` or `FINISHED`). */
  status: string;
}
