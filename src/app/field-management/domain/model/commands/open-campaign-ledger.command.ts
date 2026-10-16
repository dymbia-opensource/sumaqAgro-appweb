import { YieldUnit } from '../entities/yield-unit';

/**
 * Opens the cost ledger of a campaign (policy P8).
 */
export class OpenCampaignLedgerCommand {
  readonly campaignId: number;
  /** Sack (potato) or quintal (coffee). */
  readonly yieldUnit: YieldUnit;

  constructor(props: { campaignId: number; yieldUnit: YieldUnit }) {
    this.campaignId = props.campaignId;
    this.yieldUnit = props.yieldUnit;
  }
}
