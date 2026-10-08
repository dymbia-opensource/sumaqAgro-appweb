import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/** API representation of a cooperative. */
export interface CooperativeResource extends BaseResource {
  id: number;
  directorUserId: number;
  legalName: string;
  region: string;
  institutionalEmail: string;
  legalRepresentative: string;
  ruc: string;
  headquartersAddress: string;
  switchboardPhone: string;
}

/** API response used by the production service when it wraps cooperatives. */
export interface CooperativesResponse extends BaseResponse {
  cooperatives: CooperativeResource[];
}
