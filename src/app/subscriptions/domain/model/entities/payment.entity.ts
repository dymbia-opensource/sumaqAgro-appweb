import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { Money } from '../../../../shared/domain/model/money';
import { PaymentStatus } from './payment-status';

/** One charge of a subscription, confirmed by the payment gateway */
export class Payment extends BaseEntity {
  private _subscriptionId: number;
  private _amount: Money;
  private _transactionToken: string;
  private _status: PaymentStatus;
  private _paidAt: Date;

  constructor(props: {
    id: number;
    subscriptionId: number;
    amount: Money;
    transactionToken: string;
    status: PaymentStatus;
    paidAt: Date;
  }) {
    super({ id: props.id });
    this._subscriptionId = props.subscriptionId;
    this._amount = props.amount;
    this._transactionToken = props.transactionToken;
    this._status = props.status;
    this._paidAt = props.paidAt;
  }

  get subscriptionId(): number {
    return this._subscriptionId;
  }

  get amount(): Money {
    return this._amount;
  }

  /** Token returned by the gateway; the card number is never stored. */
  get transactionToken(): string {
    return this._transactionToken;
  }

  get status(): PaymentStatus {
    return this._status;
  }

  get paidAt(): Date {
    return this._paidAt;
  }

  isCompleted(): boolean {
    return this._status === PaymentStatus.COMPLETED;
  }

  isRejected(): boolean {
    return this._status === PaymentStatus.REJECTED;
  }
}
