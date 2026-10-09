import { BaseResource } from '../../../shared/infrastructure/base-response';
import { ExpenseEntryResource } from './expense-entry.response';

/**
 * Resource representation of the cost ledger of a campaign.
 */
export interface CampaignLedgerResource extends BaseResource {
  /** Unique identifier of the ledger. */
  id: number;
  /** Campaign of the ledger. */
  campaignId: number;
  /** Yield the producer expects to harvest. */
  expectedYield: number;
  /** Yield actually harvested, or `null` before the harvest. */
  actualYield: number | null;
  /** Unit of the yield (`SACK` or `QUINTAL`). */
  yieldUnit: string;
  /** `true` when the ledger is closed. */
  frozen?: boolean;
  /** Expenses of the ledger. */
  entries: ExpenseEntryResource[];
}
