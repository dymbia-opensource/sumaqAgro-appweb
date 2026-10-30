import { BaseResponse } from '../../../shared/infrastructure/base-response';
import { PaymentResource } from './payment.response';

/** Response that wraps a list of payments. */
export interface PaymentsResponse extends BaseResponse {
  payments: PaymentResource[];
}
