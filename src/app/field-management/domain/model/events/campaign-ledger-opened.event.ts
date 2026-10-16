import { FieldManagementEvent } from './field-management.event';

/**
 * The cost ledger of a campaign was opened (policy P8).
 */
export class CampaignLedgerOpenedEvent extends FieldManagementEvent {
  /** Ledger identifier (`0` until the API assigns one). */
  readonly ledgerId: number;
  /** Campaign of the ledger. */
  readonly campaignId: number;

  constructor(props: { ledgerId: number; campaignId: number }) {
    super();
    this.ledgerId = props.ledgerId;
    this.campaignId = props.campaignId;
  }
}
