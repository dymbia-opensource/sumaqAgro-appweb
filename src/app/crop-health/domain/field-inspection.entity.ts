import { BaseEntity } from '../../shared/domain/model/base-entity';

/**
 * Properties required to instantiate a {@link FieldInspection}.
 */
export interface FieldInspectionProps {
  id?: number | string;
  reportId: number;
  scheduledAt: string;
  notes?: string;
}

/**
 * Domain entity representing an agronomist technical on-site visit to inspect a reported issue.
 */
export class FieldInspection extends BaseEntity {
  private _reportId: number;
  private _scheduledAt: string;
  private _notes: string;

  /**
   * Initializes a new instance of the {@link FieldInspection} class.
   *
   * @param props - Field inspection properties.
   */
  constructor(props: FieldInspectionProps) {
    super({ id: props.id ?? 0 });
    this._reportId = props.reportId;
    this._scheduledAt = props.scheduledAt;
    this._notes = props.notes ?? '';
  }

  /** Gets the related pest report identifier. */
  get reportId(): number {
    return this._reportId;
  }

  /** Gets the scheduled date and time for the technical visit. */
  get scheduledAt(): string {
    return this._scheduledAt;
  }

  /** Gets technical diagnosis notes or agronomist recommendations. */
  get notes(): string {
    return this._notes;
  }
}
