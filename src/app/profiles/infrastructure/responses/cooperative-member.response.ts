import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/** API representation of a cooperative member. */
export interface CooperativeMemberResource extends BaseResource {
  id: number;
  cooperativeId: number;
  fullName: string;
  active: boolean;
}

/** API response used by the production service when it wraps members. */
export interface CooperativeMembersResponse extends BaseResponse {
  members: CooperativeMemberResource[];
}
