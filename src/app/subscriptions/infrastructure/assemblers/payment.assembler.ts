import { Money } from '../../../shared/domain/model/money';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { Payment } from '../../domain/model/entities/payment.entity';
import { PaymentStatus } from '../../domain/model/entities/payment-status';
import { PaymentResource } from '../responses/payment.response';
import { PaymentsResponse } from '../responses/payments.response';

/** Maps payment entities to and from API resources. */
export class PaymentAssembler implements BaseAssembler<Payment, PaymentResource, PaymentsResponse> {
  toEntitiesFromResponse = (response: PaymentsResponse): Payment[] =>
    response.payments.map((resource) => this.toEntityFromResource(resource));

  toEntityFromResource = (resource: PaymentResource): Payment =>
    new Payment({
      id: resource.id,
      subscriptionId: resource.subscriptionId,
      amount: new Money(resource.amount, resource.currency),
      transactionToken: resource.transactionToken,
      status: resource.status as PaymentStatus,
      paidAt: new Date(resource.paidAt),
    });

  toResourceFromEntity = (entity: Payment): PaymentResource => ({
    id: entity.id as number,
    subscriptionId: entity.subscriptionId,
    amount: entity.amount.amount,
    currency: entity.amount.currency,
    transactionToken: entity.transactionToken,
    status: entity.status,
    paidAt: entity.paidAt.toISOString(),
  });
}
