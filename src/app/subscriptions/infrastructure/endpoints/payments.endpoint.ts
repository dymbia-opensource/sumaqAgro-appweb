import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { Payment } from '../../domain/model/entities/payment.entity';
import { PaymentAssembler } from '../assemblers/payment.assembler';
import { PaymentResource } from '../responses/payment.response';
import { PaymentsResponse } from '../responses/payments.response';

/** HTTP endpoint for the payments resource (`/payments`). */
export class PaymentsApiEndpoint extends BaseApiEndpoint<
  Payment,
  PaymentResource,
  PaymentsResponse,
  PaymentAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderPaymentsEndpointPath}`,
      new PaymentAssembler(),
    );
  }

  /**
   * Loads the payments of one subscription.
   * @param subscriptionId - Subscription that was charged.
   */
  getBySubscription(subscriptionId: number): Observable<Payment[]> {
    return this.getAllBy({ subscriptionId }, 'Failed to fetch the payments of the subscription');
  }
}
