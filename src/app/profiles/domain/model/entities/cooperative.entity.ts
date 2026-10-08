import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/**
 * Institutional profile of a cooperative managed by a cooperative director.
 *
 * The cooperative is the aggregate root of the institutional information
 * managed by Profiles. Agricultural plots and campaigns remain in Field
 * Management and are only referenced by their identifiers in later features.
 */
export class Cooperative extends BaseEntity {
  private readonly _directorUserId: number;
  private readonly _legalName: string;
  private readonly _region: string;
  private readonly _institutionalEmail: string;
  private readonly _legalRepresentative: string;
  private readonly _ruc: string;
  private readonly _headquartersAddress: string;
  private readonly _switchboardPhone: string;

  constructor(props: {
    id: number;
    directorUserId: number;
    legalName: string;
    region: string;
    institutionalEmail: string;
    legalRepresentative: string;
    ruc: string;
    headquartersAddress: string;
    switchboardPhone: string;
  }) {
    super({ id: props.id });
    this._directorUserId = props.directorUserId;
    this._legalName = props.legalName;
    this._region = props.region;
    this._institutionalEmail = props.institutionalEmail;
    this._legalRepresentative = props.legalRepresentative;
    this._ruc = props.ruc;
    this._headquartersAddress = props.headquartersAddress;
    this._switchboardPhone = props.switchboardPhone;
  }

  get directorUserId(): number { return this._directorUserId; }
  get legalName(): string { return this._legalName; }
  get region(): string { return this._region; }
  get institutionalEmail(): string { return this._institutionalEmail; }
  get legalRepresentative(): string { return this._legalRepresentative; }
  get ruc(): string { return this._ruc; }
  get headquartersAddress(): string { return this._headquartersAddress; }
  get switchboardPhone(): string { return this._switchboardPhone; }
}
