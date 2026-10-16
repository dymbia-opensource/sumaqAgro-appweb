/**
 * Resource representation of the initial soil analysis of a plot.
 *
 * @remarks
 * The RESTful API stores it in the `soil_*` columns of `field_plots`.
 */
export interface SoilBaselineResource {
  /** pH of the soil, between 0 and 14. */
  ph: number;
  /** Texture (`SANDY`, `LOAMY`, `CLAY`, `SILTY`, `SANDY_LOAM` or `CLAY_LOAM`). */
  texture: string;
  /** Organic matter, from 0 to 100 %. */
  organicMatterPercentage: number;
  /** Date of the analysis in `YYYY-MM-DD` format. */
  recordedAt: string;
}
