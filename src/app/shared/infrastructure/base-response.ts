/**
 * Base shape of a single record exchanged with the RESTful API.
 */
export interface BaseResource {
  id: number | string;
}

/**
 * Marker contract for responses that wrap a list of resources
 * (for example, `{ plots: FieldPlotResource[] }`).
 */
export interface BaseResponse {}
