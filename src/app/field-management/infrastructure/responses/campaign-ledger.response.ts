import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/** One expense of the cost ledger as the RESTful API sends it. */
export interface ExpenseEntryResource extends BaseResource {
  id: number;
  category: string;
  description: string;
  quantity: number;
  /** Price per unit, in soles. */
  unitPrice: number;
  /** Date in `YYYY-MM-DD` format. */
  expenseDate: string;
  notes?: string;
  clientSyncId: string;
}

/** Cost ledger of a campaign as the RESTful API sends it. */
export interface CampaignLedgerResource extends BaseResource {
  id: number;
  campaignId: number;
  expectedYield: number;
  actualYield: number | null;
  yieldUnit: string;
  frozen?: boolean;
  entries: ExpenseEntryResource[];
}

/** Response that wraps a list of cost ledgers. */
export interface CampaignLedgersResponse extends BaseResponse {
  ledgers: CampaignLedgerResource[];
}
