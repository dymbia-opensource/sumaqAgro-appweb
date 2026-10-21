import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/** Origin information exposed by Profiles for a member's registered plots. */
export interface MemberPlot {
  id: number;
  name: string;
  region: string;
  coordinates: string;
  campaignId: number;
  variety: string;
  cropType: 'ANDEAN_POTATO' | 'SPECIALTY_COFFEE';
}

/** Read model of a cooperative member used by the institutional dashboard. */
export class CooperativeMember extends BaseEntity {
  /** Linked account; absent legacy links never imply equality with the membership ID. */
  readonly userId: number | null;
  /** Plot references owned by this member, supplied by the Profiles read model. */
  readonly plots: MemberPlot[];
  private readonly _cooperativeId: number;
  private readonly _fullName: string;
  private readonly _active: boolean;

  constructor(props: {
    id: number;
    cooperativeId: number;
    fullName: string;
    active: boolean;
    userId?: number | null;
    plots?: MemberPlot[];
  }) {
    super({ id: props.id });
    this._cooperativeId = props.cooperativeId;
    this._fullName = props.fullName;
    this._active = props.active;
    this.userId = props.userId ?? null;
    this.plots = props.plots ?? [];
  }

  get cooperativeId(): number {
    return this._cooperativeId;
  }
  get fullName(): string {
    return this._fullName;
  }
  /** Display name used by member selectors in other contexts. */
  get name(): string {
    return this._fullName;
  }
  get active(): boolean {
    return this._active;
  }
}
