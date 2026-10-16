import { FieldManagementEvent } from './field-management.event';

/**
 * The cost report of a campaign was exported.
 */
export class CampaignCostReportExportedEvent extends FieldManagementEvent {
  /** Ledger identifier. */
  readonly ledgerId: number;
  /** Campaign of the report. */
  readonly campaignId: number;

  constructor(props: { ledgerId: number; campaignId: number }) {
    super();
    this.ledgerId = props.ledgerId;
    this.campaignId = props.campaignId;
  }
}
