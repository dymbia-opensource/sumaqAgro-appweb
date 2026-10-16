import { Money } from '../../../../shared/domain/model/money';
import { FieldManagementEvent } from './field-management.event';

/**
 * The daily wages of a field task were recorded (US-38). It triggers policy P9.
 */
export class DailyLaborExpenseRecordedEvent extends FieldManagementEvent {
  /** Ledger identifier. */
  readonly ledgerId: number;
  /** Expense identifier inside the ledger. */
  readonly expenseId: number;
  /** Total of the expense. */
  readonly total: Money;

  constructor(props: { ledgerId: number; expenseId: number; total: Money }) {
    super();
    this.ledgerId = props.ledgerId;
    this.expenseId = props.expenseId;
    this.total = props.total;
  }
}
