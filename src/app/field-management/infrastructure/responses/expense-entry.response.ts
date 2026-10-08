import { BaseResource } from '../../../shared/infrastructure/base-response';

/**
 * Resource representation of one expense of a cost ledger.
 */
export interface ExpenseEntryResource extends BaseResource {
  /** Identifier of the expense inside its ledger. */
  id: number;
  /** Category (`INPUTS`, `LABOR` or `FREIGHT`). */
  category: string;
  /** What was paid for. */
  description: string;
  /** Quantity bought or worked. */
  quantity: number;
  /** Price per unit, in soles. */
  unitPrice: number;
  /** Date in `YYYY-MM-DD` format. */
  expenseDate: string;
  /** Optional notes. */
  notes?: string;
  /** Code generated on the device when the expense was recorded offline. */
  clientSyncId: string;
}
