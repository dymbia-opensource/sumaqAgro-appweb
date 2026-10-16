import { FieldManagementEvent } from './field-management.event';

/**
 * The polygon of a plot was registered in AgroMonitoring, so it is monitored by satellite (US-30).
 */
export class PlotPolygonLinkedEvent extends FieldManagementEvent {
  /** Plot identifier. */
  readonly plotId: number;
  /** Polygon identifier in AgroMonitoring. */
  readonly agroMonitoringPolygonId: string;

  constructor(props: { plotId: number; agroMonitoringPolygonId: string }) {
    super();
    this.plotId = props.plotId;
    this.agroMonitoringPolygonId = props.agroMonitoringPolygonId;
  }
}
