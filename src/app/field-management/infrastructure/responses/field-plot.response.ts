import { BaseResource } from '../../../shared/infrastructure/base-response';

/**
 * Resource representation of a field plot.
 */
export interface FieldPlotResource extends BaseResource {
  /** Unique identifier of the plot. */
  id: number;
  /** Producer who owns the plot. */
  ownerUserId: number;
  /** Name of the plot. */
  name: string;
  /** Region or valley of the plot. */
  region: string;
  /** Monitoring status (`WITHOUT_POLYGON` or `ACTIVE_MONITORING`). */
  status: string;
  /** Polygon vertices as `[latitude, longitude]` pairs. */
  boundary: number[][];
  /** Area of the plot, in hectares. */
  areaHectares: number;
  /** Polygon identifier in AgroMonitoring, or an empty text. */
  agroMonitoringPolygonId: string;
}
