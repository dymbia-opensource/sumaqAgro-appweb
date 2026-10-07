import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/**
 * Properties required to instantiate a {@link PestReport}.
 */
export interface PestReportProps {
  id?: number | string;
  plotId: number;
  plotName?: string;
  reporterId: number;
  description: string;
  severity?: string;
  status?: string;
  photo?: string;
  clientSyncId?: string;
}

/**
 * Domain entity representing an incidence of pest or phytosanitary disease reported in a plot.
 */
export class PestReport extends BaseEntity {
  private _plotId: number;
  private _plotName: string;
  private _reporterId: number;
  private _description: string;
  private _severity: string;
  private _status: string;
  private _photo: string;
  private _clientSyncId: string;

  /**
   * Initializes a new instance of the {@link PestReport} class.
   *
   * @param props - Pest report data.
   */
  constructor(props: PestReportProps) {
    super({ id: props.id ?? 0 });
    this._plotId = props.plotId;
    this._plotName = props.plotName ?? '';
    this._reporterId = props.reporterId;
    this._description = props.description;
    this._severity = props.severity ?? 'MEDIUM';
    this._status = props.status ?? 'PENDING';
    this._photo = props.photo ?? '';
    this._clientSyncId = props.clientSyncId ?? '';
  }

  /** Gets the plot identifier where the pest was detected. */
  get plotId(): number {
    return this._plotId;
  }

  /** Gets the descriptive name of the plot. */
  get plotName(): string {
    return this._plotName;
  }

  /** Gets the user ID of the producer or technician who filed the report. */
  get reporterId(): number {
    return this._reporterId;
  }

  /** Gets the descriptive observations of symptoms. */
  get description(): string {
    return this._description;
  }

  /** Gets the severity degree (LOW, MEDIUM, HIGH, SEVERE). */
  get severity(): string {
    return this._severity;
  }

  /** Gets the workflow status (PENDING, INSPECTED, RESOLVED). */
  get status(): string {
    return this._status;
  }

  /** Gets the URL or base64 evidence picture. */
  get photo(): string {
    return this._photo;
  }

  /** Gets the client-side UUID used for offline synchronization. */
  get clientSyncId(): string {
    return this._clientSyncId;
  }
}
