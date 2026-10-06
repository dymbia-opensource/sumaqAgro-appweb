import { GeoCoordinate } from '../entities/geo-coordinate.entity';

/**
 * Saves the GPS polygon of a plot.
 */
export class DelineatePlotBoundaryCommand {
  readonly plotId: number;
  /** Vertices of the polygon; at least three. */
  readonly coordinates: GeoCoordinate[];

  constructor(props: { plotId: number; coordinates: GeoCoordinate[] }) {
    this.plotId = props.plotId;
    this.coordinates = props.coordinates;
  }
}
