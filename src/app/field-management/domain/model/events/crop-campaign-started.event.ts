import { FieldManagementEvent } from './field-management.event';

/**
 * A new crop campaign started on a plot. It triggers policy P8 (open the cost ledger).
 */
export class CropCampaignStartedEvent extends FieldManagementEvent {
  /** Campaign identifier (`0` until the API assigns one). */
  readonly campaignId: number;
  /** Plot of the campaign. */
  readonly plotId: number;
  /** Agricultural season, for example `2026-I`. */
  readonly season: string;

  constructor(props: { campaignId: number; plotId: number; season: string }) {
    super();
    this.campaignId = props.campaignId;
    this.plotId = props.plotId;
    this.season = props.season;
  }
}
