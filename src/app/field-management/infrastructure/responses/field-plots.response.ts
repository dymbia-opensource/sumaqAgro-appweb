import { BaseResponse } from '../../../shared/infrastructure/base-response';
import { FieldPlotResource } from './field-plot.response';

/**
 * Response envelope for field plot collection queries.
 */
export interface FieldPlotsResponse extends BaseResponse {
  /** Field plot resources included in the response. */
  plots: FieldPlotResource[];
}
