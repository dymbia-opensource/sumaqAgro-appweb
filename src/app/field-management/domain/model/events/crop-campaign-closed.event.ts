import { FieldManagementEvent } from './field-management.event';

/**
 * A crop campaign was closed; its cost ledger stops accepting expenses.
 */
export class CropCampaignClosedEvent extends FieldManagementEvent {
  /** Campaign identifier. */
  readonly campaignId: number;
  /** Plot of the campaign. */
  readonly plotId: number;

  constructor(props: { campaignId: number; plotId: number }) {
    super();
    this.campaignId = props.campaignId;
    this.plotId = props.plotId;
  }
}
