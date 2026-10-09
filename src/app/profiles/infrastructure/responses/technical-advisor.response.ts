import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/** API representation of a technical advisor (agronomist). */
export interface TechnicalAdvisorResource extends BaseResource {
  id: number;
  cooperativeId: number;
  userId?: number;
  name: string;
  cipCode: string;
  phone: string;
  assignedPlotsCount: number;
}

/** API response wrapper for technical advisors. */
export interface TechnicalAdvisorsResponse extends BaseResponse {
  agronomists: TechnicalAdvisorResource[];
}
