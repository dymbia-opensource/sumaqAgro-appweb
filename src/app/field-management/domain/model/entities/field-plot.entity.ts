import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/** Monitoring status of a field plot. */
export enum PlotStatus {
  /** The plot was registered but its GPS polygon is not drawn yet. */
  WITHOUT_POLYGON = 'WITHOUT_POLYGON',
  /** The polygon is linked to AgroMonitoring and the plot is monitored by satellite. */
  ACTIVE_MONITORING = 'ACTIVE_MONITORING',
}

/** Texture of the soil, according to the initial soil analysis. */
export enum SoilTexture {
  SANDY = 'SANDY',
  LOAMY = 'LOAMY',
  CLAY = 'CLAY',
  SILTY = 'SILTY',
  SANDY_LOAM = 'SANDY_LOAM',
  CLAY_LOAM = 'CLAY_LOAM',
}

/** One vertex of the GPS polygon of a plot. */
export class GeoCoordinate {
  private _latitude: number;
  private _longitude: number;

  constructor(latitude: number, longitude: number) {
    this._latitude = latitude;
    this._longitude = longitude;
  }

  get latitude(): number {
    return this._latitude;
  }

  set latitude(value: number) {
    this._latitude = value;
  }

  get longitude(): number {
    return this._longitude;
  }

  set longitude(value: number) {
    this._longitude = value;
  }
}

/** Initial soil analysis of a plot. */
export class SoilBaseline {
  private _ph: number;
  private _texture: SoilTexture;
  private _organicMatterPercentage: number;
  private _recordedAt: Date;

  constructor(props: {
    ph: number;
    texture: SoilTexture;
    organicMatterPercentage: number;
    recordedAt: Date;
  }) {
    this._ph = props.ph;
    this._texture = props.texture;
    this._organicMatterPercentage = props.organicMatterPercentage;
    this._recordedAt = props.recordedAt;
  }

  get ph(): number {
    return this._ph;
  }

  set ph(value: number) {
    this._ph = value;
  }

  get texture(): SoilTexture {
    return this._texture;
  }

  set texture(value: SoilTexture) {
    this._texture = value;
  }

  get organicMatterPercentage(): number {
    return this._organicMatterPercentage;
  }

  set organicMatterPercentage(value: number) {
    this._organicMatterPercentage = value;
  }

  get recordedAt(): Date {
    return this._recordedAt;
  }

  set recordedAt(value: Date) {
    this._recordedAt = value;
  }
}

/**
 * Field plot of a producer, with its GPS polygon and its soil analysis.
 *
 * @remarks
 * Root of the `FieldPlot` aggregate. It only holds the data of the plot.
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

  set ownerUserId(value: number) {
    this._ownerUserId = value;
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

  set region(value: string) {
    this._region = value;
  }

  get status(): PlotStatus {
    return this._status;
  }

  set status(value: PlotStatus) {
    this._status = value;
  }

  /** Vertices of the GPS polygon, in order. */
  get boundary(): GeoCoordinate[] {
    return this._boundary;
  }

  set boundary(value: GeoCoordinate[]) {
    this._boundary = value;
  }

  get areaHectares(): number {
    return this._areaHectares;
  }

  set areaHectares(value: number) {
    this._areaHectares = value;
  }

  get agroMonitoringPolygonId(): string | null {
    return this._agroMonitoringPolygonId;
  }

  set agroMonitoringPolygonId(value: string | null) {
    this._agroMonitoringPolygonId = value;
  }

  /** Initial soil analysis, or `null` if it was not recorded. */
  get soilBaseline(): SoilBaseline | null {
    return this._soilBaseline;
  }

  set soilBaseline(value: SoilBaseline | null) {
    this._soilBaseline = value;
  }

  /**
   * `true` when the polygon has at least three vertices.
   *
   * @remarks
   * Crop Health reads it to know if the plot can be monitored by satellite.
   */
  hasPolygon(): boolean {
    return this._boundary.length >= 3;
  }
}
