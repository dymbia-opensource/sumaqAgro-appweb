import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface FieldInspectionResource extends BaseResource {
  id: number;
  reportId: number;
  scheduledAt: string;
  notes: string;
}

export interface FieldInspectionsResponse extends BaseResponse {
  inspections: FieldInspectionResource[];
}
