import { fromApiDate, toApiDate } from '../../../shared/infrastructure/api-date';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { BillingCycle } from '../../domain/model/entities/billing-cycle';
import { Subscription } from '../../domain/model/entities/subscription.entity';
import { SubscriptionStatus } from '../../domain/model/entities/subscription-status';
import { SubscriptionResource, SubscriptionsResponse } from '../responses/subscription.response';

/**
 * Maps subscription entities to and from API resources.
 *
 * @remarks
 * The resource only has the `planId`; the store completes the plan.
 */
export class SubscriptionAssembler implements BaseAssembler<
  Subscription,
  SubscriptionResource,
  SubscriptionsResponse
> {
  toEntitiesFromResponse = (response: SubscriptionsResponse): Subscription[] =>
    response.subscriptions.map((resource) => this.toEntityFromResource(resource));

  toEntityFromResource = (resource: SubscriptionResource): Subscription =>
    new Subscription({
      id: resource.id,
      userId: resource.userId,
      planId: resource.planId,
      status: resource.status as SubscriptionStatus,
      billingCycle: resource.billingCycle as BillingCycle,
      startDate: fromApiDate(resource.startDate),
      endDate: resource.endDate ? fromApiDate(resource.endDate) : null,
      autoRenew: resource.autoRenew,
    });

  toResourceFromEntity = (entity: Subscription): SubscriptionResource => ({
    id: entity.id as number,
    userId: entity.userId,
    planId: entity.planId,
    status: entity.status,
    billingCycle: entity.billingCycle,
    startDate: toApiDate(entity.startDate),
    endDate: entity.endDate ? toApiDate(entity.endDate) : null,
    autoRenew: entity.autoRenew,
  });
}
