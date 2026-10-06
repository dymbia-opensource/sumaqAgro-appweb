import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { GeoCoordinate } from './geo-coordinate.entity';
import { PlotStatus } from './plot-status';
import { SoilBaseline } from './soil-baseline.entity';

/**
 * Field plot of a producer, with its GPS polygon and soil analysis.
 */
export class FieldPlot extends BaseEntity {
  private _ownerUserId: number;
  private _name: string;
  private _region: string;
  private _status: PlotStatus;
  private _boundary: GeoCoordinate[];
  private _areaHectares: number;
  private _agroMonitoringPolygonId: string | null;
  private _soilBaseline: SoilBaseline | null;

  constructor(props: {
    id: number;
    ownerUserId: number;
    name: string;
    region: string;
    status?: PlotStatus;
    boundary?: GeoCoordinate[];
    areaHectares?: number;
    agroMonitoringPolygonId?: string | null;
    soilBaseline?: SoilBaseline | null;
  }) {
    super({ id: props.id });
    this._ownerUserId = props.ownerUserId;
    this._name = props.name;
    this._region = props.region;
    this._status = props.status ?? PlotStatus.WITHOUT_POLYGON;
    this._boundary = props.boundary ?? [];
    this._areaHectares = props.areaHectares ?? 0;
    this._agroMonitoringPolygonId = props.agroMonitoringPolygonId ?? null;
    this._soilBaseline = props.soilBaseline ?? null;
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

  get soilBaseline(): SoilBaseline | null {
    return this._soilBaseline;
  }

  /** `true` when the polygon has at least three vertices. */
  hasPolygon(): boolean {
    return this._boundary.length >= 3;
  }

  /** `true` when the plot is linked to AgroMonitoring and monitored by satellite. */
  isMonitored(): boolean {
    return this._status === PlotStatus.ACTIVE_MONITORING;
  }
}
