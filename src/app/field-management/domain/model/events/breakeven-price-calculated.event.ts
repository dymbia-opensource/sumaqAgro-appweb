import { Money } from '../../../../shared/domain/model/money';
import { FieldManagementEvent } from './field-management.event';

/**
 * The breakeven price of the campaign was calculated again (US-40).
 */
export class BreakevenPriceCalculatedEvent extends FieldManagementEvent {
  /** Ledger identifier. */
  readonly ledgerId: number;
  /** Minimum price per unit to recover the investment. */
  readonly breakevenPrice: Money;

  constructor(props: { ledgerId: number; breakevenPrice: Money }) {
    super();
    this.ledgerId = props.ledgerId;
    this.breakevenPrice = props.breakevenPrice;
  }
}
