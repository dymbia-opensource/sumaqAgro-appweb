import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { GeoCoordinate } from './geo-coordinate';
import { PlotStatus } from './plot-status';

/**
 * Field plot of a producer, with its GPS polygon.
 */
export class FieldPlot extends BaseEntity {
  private _ownerUserId: number;
  private _name: string;
  private _region: string;
  private _status: PlotStatus;
  private _boundary: GeoCoordinate[];
  private _areaHectares: number;
  private _agroMonitoringPolygonId: string | null;

  constructor(props: {
    id: number;
    ownerUserId: number;
    name: string;
    region: string;
    status?: PlotStatus;
    boundary?: GeoCoordinate[];
    areaHectares?: number;
    agroMonitoringPolygonId?: string | null;
  }) {
    super({ id: props.id });
    this._ownerUserId = props.ownerUserId;
    this._name = props.name;
    this._region = props.region;
    this._status = props.status ?? PlotStatus.WITHOUT_POLYGON;
    this._boundary = props.boundary ?? [];
    this._areaHectares = props.areaHectares ?? 0;
    this._agroMonitoringPolygonId = props.agroMonitoringPolygonId ?? null;
  }

  get ownerUserId(): number {
    return this._ownerUserId;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get region(): string {
    return this._region;
  }

  get status(): PlotStatus {
    return this._status;
  }

  /** Vertices of the GPS polygon, in order. */
  get boundary(): GeoCoordinate[] {
    return [...this._boundary];
  }

  get areaHectares(): number {
    return this._areaHectares;
  }

  get agroMonitoringPolygonId(): string | null {
    return this._agroMonitoringPolygonId;
  }

  /** `true` when the polygon has at least three vertices. */
  hasPolygon(): boolean {
    return this._boundary.length >= 3;
  }

  /** `true` when the plot is linked to AgroMonitoring and monitored by satellite. */
  isMonitored(): boolean {
    return this._status === PlotStatus.ACTIVE_MONITORING;
  }

  /**
   * Sets the GPS polygon of the plot and calculates its area (US-29).
   * @param coordinates - Vertices of the polygon, in order.
   * @throws Error when the polygon has less than three vertices or its sides cross.
   */
  delineateBoundary(coordinates: GeoCoordinate[]): void {
    if (coordinates.length < FieldPlot.MINIMUM_VERTICES) {
      throw new Error('The polygon needs at least three vertices.');
    }
    if (!FieldPlot.isSimplePolygon(coordinates)) {
      throw new Error('The sides of the polygon cannot cross each other.');
    }
    this._boundary = [...coordinates];
    this._areaHectares = FieldPlot.calculateAreaHectares(coordinates);
  }

  /**
   * Links the polygon to the satellite monitoring of AgroMonitoring.
   *
   * @remarks
   * With the RESTful API the backend registers the polygon in AgroMonitoring
   * (policy P3) and returns its identifier.
   *
   * @param agroMonitoringPolygonId - Polygon identifier in AgroMonitoring.
   * @throws Error when the plot has no polygon.
   */
  activateMonitoring(agroMonitoringPolygonId: string): void {
    if (!this.hasPolygon()) {
      throw new Error('The plot needs a polygon to be monitored.');
    }
    this._agroMonitoringPolygonId = agroMonitoringPolygonId;
    this._status = PlotStatus.ACTIVE_MONITORING;
  }

  /** Minimum number of vertices of a polygon. */
  static readonly MINIMUM_VERTICES = 3;

  /**
   * Area of a GPS polygon in hectares, with the shoelace formula.
   *
   * @remarks
   * The coordinates are projected to meters around the center of the polygon,
   * which is precise enough for the size of a farm plot.
   *
   * @param coordinates - Vertices of the polygon, in order.
   */
  static calculateAreaHectares(coordinates: GeoCoordinate[]): number {
    if (coordinates.length < FieldPlot.MINIMUM_VERTICES) return 0;
    const meanLatitude =
      coordinates.reduce((sum, vertex) => sum + vertex.latitude, 0) / coordinates.length;
    const metersPerDegreeLatitude = 110_540;
    const metersPerDegreeLongitude = 111_320 * Math.cos((meanLatitude * Math.PI) / 180);
    const points = coordinates.map((vertex) => ({
      x: vertex.longitude * metersPerDegreeLongitude,
      y: vertex.latitude * metersPerDegreeLatitude,
    }));
    const doubleArea = points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0);
    return Math.abs(doubleArea) / 2 / 10_000;
  }

  /**
   * Tells whether the sides of a polygon do not cross each other (US-29).
   * @param coordinates - Vertices of the polygon, in order.
   */
  static isSimplePolygon(coordinates: GeoCoordinate[]): boolean {
    const total = coordinates.length;
    for (let i = 0; i < total; i++) {
      for (let j = i + 1; j < total; j++) {
        const adjacent = j === i + 1 || (i === 0 && j === total - 1);
        if (
          !adjacent &&
          FieldPlot.segmentsCross(
            coordinates[i],
            coordinates[(i + 1) % total],
            coordinates[j],
            coordinates[(j + 1) % total],
          )
        ) {
          return false;
        }
      }
    }
    return true;
  }

  /** `true` when the segment a-b crosses the segment c-d. */
  private static segmentsCross(
    a: GeoCoordinate,
    b: GeoCoordinate,
    c: GeoCoordinate,
    d: GeoCoordinate,
  ): boolean {
    const orientation = (p: GeoCoordinate, q: GeoCoordinate, r: GeoCoordinate) =>
      Math.sign(
        (q.longitude - p.longitude) * (r.latitude - p.latitude) -
          (q.latitude - p.latitude) * (r.longitude - p.longitude),
      );
    return (
      orientation(a, b, c) * orientation(a, b, d) < 0 &&
      orientation(c, d, a) * orientation(c, d, b) < 0
    );
  }
}
