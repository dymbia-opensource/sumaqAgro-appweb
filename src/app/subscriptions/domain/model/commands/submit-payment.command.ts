import { Money } from '../../../../shared/domain/model/money';
import { PaymentStatus } from '../entities/payment-status';

/**
 * Sends the payment of the selected plan.
 *
 * @remarks
 * `cardToken` is the token returned by the gateway; the card number never reaches the application.
 * `simulatedStatus` is temporary: with the fake API
 * it decides if the payment is approved or rejected, until Niubiz answers.
 */
export class SubmitPaymentCommand {
  readonly subscriptionId: number;
  readonly cardToken: string;
  readonly amount: Money;
  readonly simulatedStatus?: PaymentStatus.COMPLETED | PaymentStatus.REJECTED;

  constructor(props: {
    subscriptionId: number;
    cardToken: string;
    amount: Money;
    simulatedStatus?: PaymentStatus.COMPLETED | PaymentStatus.REJECTED;
  }) {
    this.subscriptionId = props.subscriptionId;
    this.cardToken = props.cardToken;
    this.amount = props.amount;
    this.simulatedStatus = props.simulatedStatus;
  }
}
