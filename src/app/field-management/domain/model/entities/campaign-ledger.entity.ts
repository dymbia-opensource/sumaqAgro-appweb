import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { ExpenseEntry } from './expense-entry.entity';

/** Units used to measure the harvest yield. */
export enum YieldUnit {
  /** Sack, used for potato. */
  SACK = 'SACK',
  /** Quintal (46 kg), used for coffee. */
  QUINTAL = 'QUINTAL',
}

/**
 * Cost ledger of a crop campaign: its expenses and its yield.
 *
 * @remarks
 * Root of the `CampaignLedger` aggregate. It only holds the data of the
 * ledger; its figures (total investment, breakeven price) are calculated by
 * the store.
 */
export class CampaignLedger extends BaseEntity {
  private _campaignId: number;
  private _entries: ExpenseEntry[];
  private _expectedYield: number;
  private _actualYield: number | null;
  private _yieldUnit: YieldUnit;
  private _frozen: boolean;
  private _currency: string;

  constructor(props: {
    id: number;
    campaignId: number;
    entries?: ExpenseEntry[];
    expectedYield?: number;
    actualYield?: number | null;
    yieldUnit?: YieldUnit;
    frozen?: boolean;
    currency?: string;
  }) {
    super({ id: props.id });
    this._campaignId = props.campaignId;
    this._entries = props.entries ?? [];
    this._expectedYield = props.expectedYield ?? 0;
    this._actualYield = props.actualYield ?? null;
    this._yieldUnit = props.yieldUnit ?? YieldUnit.SACK;
    this._frozen = props.frozen ?? false;
    this._currency = props.currency ?? 'PEN';
  }

  get campaignId(): number {
    return this._campaignId;
  }

  set campaignId(value: number) {
    this._campaignId = value;
  }

  /** Expenses of the ledger, in the order they were recorded. */
  get entries(): ExpenseEntry[] {
    return this._entries;
  }

  set entries(value: ExpenseEntry[]) {
    this._entries = value;
  }

  get expectedYield(): number {
    return this._expectedYield;
  }

  set expectedYield(value: number) {
    this._expectedYield = value;
  }

  get actualYield(): number | null {
    return this._actualYield;
  }

  set actualYield(value: number | null) {
    this._actualYield = value;
  }

  get yieldUnit(): YieldUnit {
    return this._yieldUnit;
  }

  set yieldUnit(value: YieldUnit) {
    this._yieldUnit = value;
  }

  /** `true` when the ledger is closed and does not accept new expenses. */
  get frozen(): boolean {
    return this._frozen;
  }

  set frozen(value: boolean) {
    this._frozen = value;
  }

  get currency(): string {
    return this._currency;
  }

  set currency(value: string) {
    this._currency = value;
  }
}
