import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/** Farmer profile as it is exchanged with the RESTful API. */
export interface FarmerProfileResource extends BaseResource {
  id: number;
  userId: number;
  firstName?: string;
  lastName?: string;
  phoneNumber: string;
  email: string;
}

/** Wrapped response returned by the production API. */
export interface FarmerProfilesResponse extends BaseResponse {
  profiles: FarmerProfileResource[];
}
