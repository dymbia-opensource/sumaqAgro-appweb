import { Money } from '../../../../shared/domain/model/money';
import { FieldManagementEvent } from './field-management.event';

/**
 * A freight cost was recorded (US-39). It triggers policy P9.
 */
export class FieldFreightExpenseRecordedEvent extends FieldManagementEvent {
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
