import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { Money } from '../../../../shared/domain/model/money';
import { RecordDailyLaborExpenseCommand } from '../commands/record-daily-labor-expense.command';
import { RecordFieldFreightExpenseCommand } from '../commands/record-field-freight-expense.command';
import { RecordInputExpenseCommand } from '../commands/record-input-expense.command';
import { CropType } from './crop-type';
import { ExpenseCategory } from './expense-category';
import { ExpenseEntry } from './expense-entry.entity';
import { YieldUnit } from './yield-unit';

/**
 * Cost ledger of a crop campaign.
 *
 * @remarks
 * It adds up the expenses and calculates the breakeven price: the minimum
 * price per unit (sack or quintal) the producer must sell at to not lose money.
 */
export class CampaignLedger extends BaseEntity {
  private _campaignId: number;
  private _entries: ExpenseEntry[];
  private _expectedYield: number;
  private _actualYield: number | null;
  private _yieldUnit: YieldUnit;
  private _frozen: boolean;
  private readonly _currency: string;

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

  /** Expenses of the ledger, from the most recent to the oldest. */
  get entries(): ExpenseEntry[] {
    return [...this._entries].sort((a, b) => b.expenseDate.getTime() - a.expenseDate.getTime());
  }

  get expectedYield(): number {
    return this._expectedYield;
  }

  get actualYield(): number | null {
    return this._actualYield;
  }

  get yieldUnit(): YieldUnit {
    return this._yieldUnit;
  }

  /** Sum of all the expenses of the campaign. */
  totalInvestment(): Money {
    return this._entries.reduce(
      (sum, entry) => sum.add(entry.total()),
      new Money(0, this._currency),
    );
  }

  /**
   * Sum of the expenses of one category.
   * @param category - Inputs, labor or freight.
   */
  totalByCategory(category: ExpenseCategory): Money {
    return this._entries
      .filter((entry) => entry.category === category)
      .reduce((sum, entry) => sum.add(entry.total()), new Money(0, this._currency));
  }

  /**
   * Share of one category in the total investment, from 0 to 100.
   * @param category - Inputs, labor or freight.
   */
  percentageByCategory(category: ExpenseCategory): number {
    const total = this.totalInvestment().amount;
    return total === 0 ? 0 : (this.totalByCategory(category).amount / total) * 100;
  }

  /**
   * Minimum price per unit to recover the investment:
   * total investment ÷ yield (actual yield if known, otherwise the expected one).
   */
  breakevenPrice(): Money {
    const yieldQuantity = this._actualYield ?? this._expectedYield;
    if (yieldQuantity <= 0) {
      return new Money(0, this._currency);
    }
    return this.totalInvestment().multiply(1 / yieldQuantity);
  }

  /**
   * Breakeven price plus a profit margin, rounded up to the next whole unit.
   * @param marginPercentage - Expected profit, for example `10` for 10 %.
   */
  suggestedPrice(marginPercentage: number = 0): Money {
    const price = this.breakevenPrice().amount * (1 + marginPercentage / 100);
    return new Money(Math.ceil(price), this._currency);
  }

  /** Purchase of seeds, fertilizers or pesticides (US-37): quantity × unit price. */
  recordInputExpense(command: RecordInputExpenseCommand): void {
    this.addEntry(ExpenseCategory.INPUTS, command.inputName, command.quantity, command.unitPrice, command.expenseDate);
  }

  /** Wages of a field task (US-38): workers × days, paid at the daily wage. */
  recordDailyLaborExpense(command: RecordDailyLaborExpenseCommand): void {
    this.addEntry(
      ExpenseCategory.LABOR,
      command.activity,
      command.workers * command.days,
      command.dailyWage,
      command.expenseDate,
    );
  }

  /** Transport of inputs or harvest (US-39): one trip at the given cost. */
  recordFieldFreightExpense(command: RecordFieldFreightExpenseCommand): void {
    this.addEntry(ExpenseCategory.FREIGHT, command.route, 1, command.cost, command.expenseDate);
  }

  /** `true` when the ledger is closed and does not accept new expenses. */
  isFrozen(): boolean {
    return this._frozen;
  }

  /**
   * Sets the yield the producer expects to harvest, used by the breakeven price (US-40).
   * @param expectedYield - Number of sacks or quintals, greater than zero.
   * @param unit - Sack (potato) or quintal (coffee).
   */
  setExpectedYield(expectedYield: number, unit: YieldUnit): void {
    if (this._frozen) {
      throw new Error('The cost ledger is closed.');
    }
    if (expectedYield <= 0) {
      throw new Error('The expected yield must be greater than zero.');
    }
    this._expectedYield = expectedYield;
    this._yieldUnit = unit;
  }

  /** The ledger creates its own expenses, so their IDs only need to be unique inside it. */
  private addEntry(
    category: ExpenseCategory,
    description: string,
    quantity: number,
    unitPrice: number,
    expenseDate: Date,
  ): void {
    if (this._frozen) {
      throw new Error('The cost ledger is closed.');
    }
    const nextId = Math.max(0, ...this._entries.map((entry) => entry.id as number)) + 1;
    this._entries = [
      ...this._entries,
      new ExpenseEntry({
        id: nextId,
        ledgerId: this.id as number,
        category,
        description: description.trim(),
        quantity,
        unitPrice: new Money(unitPrice, this._currency),
        expenseDate,
      }),
    ];
  }

  /**
   * Unit of the yield of a crop: sacks for potato and quintals for coffee.
   * @param cropType - Crop of the campaign.
   */
  static yieldUnitOf(cropType: CropType): YieldUnit {
    return cropType === CropType.SPECIALTY_COFFEE ? YieldUnit.QUINTAL : YieldUnit.SACK;
  }
}
