import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/** Read model of a cooperative member used by the institutional dashboard. */
export class CooperativeMember extends BaseEntity {
  private readonly _cooperativeId: number;
  private readonly _fullName: string;
  private readonly _active: boolean;

  constructor(props: { id: number; cooperativeId: number; fullName: string; active: boolean }) {
    super({ id: props.id });
    this._cooperativeId = props.cooperativeId;
    this._fullName = props.fullName;
    this._active = props.active;
  }

  get cooperativeId(): number { return this._cooperativeId; }
  get fullName(): string { return this._fullName; }
  get active(): boolean { return this._active; }
}
