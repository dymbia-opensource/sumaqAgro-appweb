import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/** Field plot as the RESTful API sends it. */
export interface FieldPlotResource extends BaseResource {
  id: number;
  ownerUserId: number;
  name: string;
  region: string;
  status: string;
  /** Polygon vertices as `[latitude, longitude]` pairs. */
  boundary: number[][];
  areaHectares: number;
  agroMonitoringPolygonId: string;
}

/** Response that wraps a list of field plots. */
export interface FieldPlotsResponse extends BaseResponse {
  plots: FieldPlotResource[];
}
