import { GeoCoordinate } from '../entities/geo-coordinate';
import { FieldManagementEvent } from './field-management.event';

/**
 * The GPS polygon of a plot was marked on the map (US-29). It triggers policy P3.
 */
export class PlotBoundaryDelineatedEvent extends FieldManagementEvent {
  /** Plot identifier. */
  readonly plotId: number;
  /** Vertices of the polygon, in order. */
  readonly boundary: GeoCoordinate[];

  constructor(props: { plotId: number; boundary: GeoCoordinate[] }) {
    super();
    this.plotId = props.plotId;
    this.boundary = props.boundary;
  }
}
