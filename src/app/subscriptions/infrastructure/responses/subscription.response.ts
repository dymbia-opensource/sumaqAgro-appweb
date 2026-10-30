import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/** Subscription of a user as the API sends it. */
export interface SubscriptionResource extends BaseResource {
  id: number;
  userId: number;
  planId: number;
  /** `ACTIVE` or `CANCELLED`. */
  status: string;
  /** `MONTHLY` or `ANNUAL`. */
  billingCycle: string;
  /** Date in `YYYY-MM-DD` format. */
  startDate: string;
  /** Date in `YYYY-MM-DD` format, or `null`. */
  endDate: string | null;
  autoRenew: boolean;
}

export interface SubscriptionsResponse extends BaseResponse {
  subscriptions: SubscriptionResource[];
}
