import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/** Domain entity representing a technical advisor (agronomist) assigned to a cooperative. */
export class TechnicalAdvisor extends BaseEntity {
  private readonly _cooperativeId: number;
  private _name: string;
  private _cipCode: string;
  private _phone: string;
  private _assignedPlotsCount: number;

  constructor(props: {
    id?: number | string;
    cooperativeId: number;
    name: string;
    cipCode: string;
    phone: string;
    assignedPlotsCount: number;
  }) {
    super({ id: props.id ?? 0 });
    this._cooperativeId = props.cooperativeId;
    this._name = props.name;
    this._cipCode = props.cipCode;
    this._phone = props.phone;
    this._assignedPlotsCount = props.assignedPlotsCount;
  }

  get cooperativeId(): number {
    return this._cooperativeId;
  }

  get name(): string {
    return this._name;
  }

  get cipCode(): string {
    return this._cipCode;
  }

  get phone(): string {
    return this._phone;
  }

  get assignedPlotsCount(): number {
    return this._assignedPlotsCount;
  }

  updateDetails(name: string, cipCode: string, phone: string, assignedPlotsCount: number): void {
    if (!name || name.trim().length === 0) {
      throw new Error('El nombre del asesor es obligatorio.');
    }
    if (!cipCode || cipCode.trim().length === 0) {
      throw new Error('La colegiatura CIP es obligatoria.');
    }
    this._name = name.trim();
    this._cipCode = cipCode.trim();
    this._phone = phone ? phone.trim() : '';
    this._assignedPlotsCount = Math.max(0, assignedPlotsCount);
  }
}
