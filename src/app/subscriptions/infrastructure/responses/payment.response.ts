import { BaseResource } from '../../../shared/infrastructure/base-response';

/** Payment of a subscription as the API sends it. */
export interface PaymentResource extends BaseResource {
  id: number;
  subscriptionId: number;
  amount: number;
  currency: string;
  /** Token returned by the gateway. Never the card number. */
  transactionToken: string;
  /** `PENDING`, `COMPLETED` or `REJECTED`. */
  status: string;
  /** Date and time in ISO 8601 format. */
  paidAt: string;
}
