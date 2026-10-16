import { Money } from '../../../../shared/domain/model/money';
import { OpenCampaignLedgerCommand } from '../commands/open-campaign-ledger.command';
import { RecordDailyLaborExpenseCommand } from '../commands/record-daily-labor-expense.command';
import { RecordFieldFreightExpenseCommand } from '../commands/record-field-freight-expense.command';
import { RecordInputExpenseCommand } from '../commands/record-input-expense.command';
import { ActualYieldRecordedEvent } from '../events/actual-yield-recorded.event';
import { BreakevenPriceCalculatedEvent } from '../events/breakeven-price-calculated.event';
import { CampaignCostReportExportedEvent } from '../events/campaign-cost-report-exported.event';
import { CampaignLedgerOpenedEvent } from '../events/campaign-ledger-opened.event';
import { DailyLaborExpenseRecordedEvent } from '../events/daily-labor-expense-recorded.event';
import { ExpectedYieldSetEvent } from '../events/expected-yield-set.event';
import { FieldFreightExpenseRecordedEvent } from '../events/field-freight-expense-recorded.event';
import { InputExpenseRecordedEvent } from '../events/input-expense-recorded.event';
import { TotalInvestmentCalculatedEvent } from '../events/total-investment-calculated.event';
import { AggregateRoot } from './aggregate-root';
import { CropType } from './crop-type';
import { ExpenseCategory } from './expense-category';
import { ExpenseEntry } from './expense-entry.entity';
import { YieldUnit } from './yield-unit';

/**
 * Cost ledger of a crop campaign.
 *
 * @remarks
 * Aggregate root of the `CampaignLedger` aggregate of the EventStorming. It
 * adds up the expenses and calculates the breakeven price: the minimum price
 * per unit (sack or quintal) the producer must sell at to not lose money.
 * After every expense or a new expected yield it recalculates that price
 * (policy P9).
 */
export class CampaignLedger extends AggregateRoot {
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

  /**
   * Opens the empty cost ledger of a campaign (policy P8).
   * @param command - Campaign of the ledger and unit of its yield.
   * @returns The new ledger, with the `CampaignLedgerOpened` event.
   */
  static open(command: OpenCampaignLedgerCommand): CampaignLedger {
    const ledger = new CampaignLedger({
      id: 0,
      campaignId: command.campaignId,
      yieldUnit: command.yieldUnit,
    });
    ledger.raise(new CampaignLedgerOpenedEvent({ ledgerId: 0, campaignId: command.campaignId }));
    return ledger;
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

  get currency(): string {
    return this._currency;
  }

  /** `true` when the ledger is closed and does not accept new expenses. */
  isFrozen(): boolean {
    return this._frozen;
  }

  /**
   * Expense history, optionally of one category, the most recent first.
   * @param category - Inputs, labor or freight; all of them when it is omitted.
   */
  entriesOf(category?: ExpenseCategory | null): ExpenseEntry[] {
    return category ? this.entries.filter((entry) => entry.category === category) : this.entries;
  }

  /** `true` when an expense with this device code was already recorded. */
  hasEntryWithSyncId(clientSyncId: string): boolean {
    return !!clientSyncId && this._entries.some((entry) => entry.clientSyncId === clientSyncId);
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

  /** Yield used by the breakeven price: the actual yield if known, otherwise the expected one. */
  referenceYield(): number {
    return this._actualYield ?? this._expectedYield;
  }

  /**
   * Minimum price per unit to recover the investment:
   * total investment ÷ yield (actual yield if known, otherwise the expected one).
   */
  breakevenPrice(): Money {
    const yieldQuantity = this.referenceYield();
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

  /**
   * Investment per hectare of the plot (cost per hectare report).
   * @param areaHectares - Area of the plot.
   * @param category - Only one category; all of them when it is omitted.
   */
  costPerHectare(areaHectares: number, category?: ExpenseCategory): Money {
    if (areaHectares <= 0) {
      return new Money(0, this._currency);
    }
    const total = category ? this.totalByCategory(category) : this.totalInvestment();
    return total.multiply(1 / areaHectares);
  }

  /**
   * Yield per hectare of the plot, with the actual yield if known.
   * @param areaHectares - Area of the plot.
   */
  yieldPerHectare(areaHectares: number): number {
    return areaHectares <= 0 ? 0 : this.referenceYield() / areaHectares;
  }

  /** Purchase of seeds, fertilizers or pesticides (US-37): quantity × unit price. */
  recordInputExpense(command: RecordInputExpenseCommand): void {
    const entry = this.addEntry(
      ExpenseCategory.INPUTS,
      command.inputName,
      command.quantity,
      command.unitPrice,
      command.expenseDate,
      command.clientSyncId,
    );
    if (!entry) return;
    this.raise(
      new InputExpenseRecordedEvent({ ledgerId: this.ledgerId, expenseId: entry.id as number, total: entry.total() }),
    );
    this.recalculateBreakevenPrice();
  }

  /** Wages of a field task (US-38): workers × days, paid at the daily wage. */
  recordDailyLaborExpense(command: RecordDailyLaborExpenseCommand): void {
    const entry = this.addEntry(
      ExpenseCategory.LABOR,
      command.activity,
      command.workers * command.days,
      command.dailyWage,
      command.expenseDate,
      command.clientSyncId,
    );
    if (!entry) return;
    this.raise(
      new DailyLaborExpenseRecordedEvent({ ledgerId: this.ledgerId, expenseId: entry.id as number, total: entry.total() }),
    );
    this.recalculateBreakevenPrice();
  }

  /** Transport of inputs or harvest (US-39): one trip at the given cost. */
  recordFieldFreightExpense(command: RecordFieldFreightExpenseCommand): void {
    const entry = this.addEntry(
      ExpenseCategory.FREIGHT,
      command.route,
      1,
      command.cost,
      command.expenseDate,
      command.clientSyncId,
    );
    if (!entry) return;
    this.raise(
      new FieldFreightExpenseRecordedEvent({ ledgerId: this.ledgerId, expenseId: entry.id as number, total: entry.total() }),
    );
    this.recalculateBreakevenPrice();
  }

  /**
   * Sets the yield the producer expects to harvest, used by the breakeven price (US-40).
   * @param expectedYield - Number of sacks or quintals, greater than zero.
   * @param unit - Sack (potato) or quintal (coffee).
   */
  setExpectedYield(expectedYield: number, unit: YieldUnit): void {
    this.ensureOpen();
    if (!(expectedYield > 0)) {
      throw new Error('The expected yield must be greater than zero.');
    }
    this._expectedYield = expectedYield;
    this._yieldUnit = unit;
    this.raise(new ExpectedYieldSetEvent({ ledgerId: this.ledgerId, expectedYield, unit }));
    this.recalculateBreakevenPrice();
  }

  /**
   * Records the yield actually harvested (policy P10). It is allowed after the
   * campaign is closed, because the batch is weighed after the harvest.
   * @param actualYield - Harvested sacks or quintals, greater than zero.
   * @param unit - It must be the unit of the ledger.
   */
  recordActualYield(actualYield: number, unit: YieldUnit): void {
    if (!(actualYield > 0)) {
      throw new Error('The actual yield must be greater than zero.');
    }
    if (unit !== this._yieldUnit) {
      throw new Error('The actual yield must use the unit of the ledger.');
    }
    this._actualYield = actualYield;
    this.raise(new ActualYieldRecordedEvent({ ledgerId: this.ledgerId, actualYield, unit }));
    this.recalculateBreakevenPrice();
  }

  /**
   * Calculates again the total investment and the breakeven price (policy P9).
   * @returns The new breakeven price.
   */
  recalculateBreakevenPrice(): Money {
    const totalInvestment = this.totalInvestment();
    const breakevenPrice = this.breakevenPrice();
    this.raise(new TotalInvestmentCalculatedEvent({ ledgerId: this.ledgerId, totalInvestment }));
    this.raise(new BreakevenPriceCalculatedEvent({ ledgerId: this.ledgerId, breakevenPrice }));
    return breakevenPrice;
  }

  /** Closes the ledger when its campaign is closed; it stops accepting expenses. */
  freeze(): void {
    this._frozen = true;
  }

  /**
   * Records that the cost report of the campaign was exported.
   * The file itself is built by the infrastructure layer.
   */
  exportCostReport(): void {
    this.raise(
      new CampaignCostReportExportedEvent({ ledgerId: this.ledgerId, campaignId: this._campaignId }),
    );
  }

  /** Copy of the ledger without its pending events, to change it before the API confirms. */
  clone(): CampaignLedger {
    return new CampaignLedger({
      id: this.ledgerId,
      campaignId: this._campaignId,
      entries: this._entries,
      expectedYield: this._expectedYield,
      actualYield: this._actualYield,
      yieldUnit: this._yieldUnit,
      frozen: this._frozen,
      currency: this._currency,
    });
  }

  /**
   * Unit of the yield of a crop: sacks for potato and quintals for coffee.
   * @param cropType - Crop of the campaign.
   */
  static yieldUnitOf(cropType: CropType): YieldUnit {
    return cropType === CropType.SPECIALTY_COFFEE ? YieldUnit.QUINTAL : YieldUnit.SACK;
  }

  private get ledgerId(): number {
    return this.id as number;
  }

  /**
   * Adds an expense. The ledger creates its own expenses, so their IDs only
   * need to be unique inside it.
   * @returns The new expense, or `null` when an expense with the same device
   * code was already recorded (an offline expense synchronized twice).
   */
  private addEntry(
    category: ExpenseCategory,
    description: string,
    quantity: number,
    unitPrice: number,
    expenseDate: Date,
    clientSyncId: string,
  ): ExpenseEntry | null {
    this.ensureOpen();
    if (this.hasEntryWithSyncId(clientSyncId)) {
      return null;
    }
    const text = description.trim();
    if (!text) {
      throw new Error('The description of the expense is required.');
    }
    const nextId = Math.max(0, ...this._entries.map((entry) => entry.id as number)) + 1;
    const entry = new ExpenseEntry({
      id: nextId,
      ledgerId: this.ledgerId,
      category,
      description: text,
      quantity,
      unitPrice: new Money(unitPrice, this._currency),
      expenseDate,
      clientSyncId,
    });
    this._entries = [...this._entries, entry];
    return entry;
  }

  private ensureOpen(): void {
    if (this._frozen) {
      throw new Error('The cost ledger is closed.');
    }
  }
}
