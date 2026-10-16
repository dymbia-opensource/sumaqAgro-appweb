import { Money } from '../../../../shared/domain/model/money';
import { FieldManagementEvent } from './field-management.event';

/**
 * The total investment of the campaign was calculated again.
 */
export class TotalInvestmentCalculatedEvent extends FieldManagementEvent {
  /** Ledger identifier. */
  readonly ledgerId: number;
  /** Sum of all the expenses. */
  readonly totalInvestment: Money;

  constructor(props: { ledgerId: number; totalInvestment: Money }) {
    super();
    this.ledgerId = props.ledgerId;
    this.totalInvestment = props.totalInvestment;
  }
}
