/**
 * Links the polygon of a plot to AgroMonitoring, which starts the satellite
 * monitoring (policy P3).
 */
export class LinkPlotPolygonCommand {
  readonly plotId: number;
  /** Polygon identifier returned by AgroMonitoring. */
  readonly agroMonitoringPolygonId: string;

  constructor(props: { plotId: number; agroMonitoringPolygonId: string }) {
    this.plotId = props.plotId;
    this.agroMonitoringPolygonId = props.agroMonitoringPolygonId;
  }
}
