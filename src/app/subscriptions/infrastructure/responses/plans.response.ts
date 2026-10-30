import { BaseResponse } from '../../../shared/infrastructure/base-response';
import { PlanResource } from './plan.response';

/** Response that wraps a list of plans. */
export interface PlansResponse extends BaseResponse {
  plans: PlanResource[];
}
