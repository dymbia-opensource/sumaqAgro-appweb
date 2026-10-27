import { Money } from '../../../shared/domain/model/money';
import { CampaignLedger } from '../../domain/model/entities/campaign-ledger.entity';
import { ExpenseCategory } from '../../domain/model/entities/expense-category';
import { YieldUnit } from '../../domain/model/entities/yield-unit';

/** One row of the report: the cost of a category, in total and per hectare. */
export interface CostPerHectareRow {
  category: ExpenseCategory;
  total: Money;
  perHectare: Money;
  percentage: number;
}

/**
 * `CostPerHectareReport` read model: what the campaign cost per hectare of
 * the plot, by category, and the yield per hectare.
 */
export class CostPerHectareReport {
  readonly areaHectares: number;
  readonly rows: CostPerHectareRow[];
  readonly totalPerHectare: Money;
  readonly yieldPerHectare: number;
  readonly yieldUnit: YieldUnit;

  private constructor(ledger: CampaignLedger, areaHectares: number) {
    this.areaHectares = areaHectares;
    this.rows = Object.values(ExpenseCategory).map((category) => ({
      category,
      total: ledger.totalByCategory(category),
      perHectare: ledger.costPerHectare(areaHectares, category),
      percentage: ledger.percentageByCategory(category),
    }));
    this.totalPerHectare = ledger.costPerHectare(areaHectares);
    this.yieldPerHectare = ledger.yieldPerHectare(areaHectares);
    this.yieldUnit = ledger.yieldUnit;
  }

  /**
   * Builds the report.
   * @param ledger - Cost ledger of the campaign.
   * @param areaHectares - Area of the plot (by GPS, or the declared one).
   */
  static of(ledger: CampaignLedger, areaHectares: number): CostPerHectareReport {
    return new CostPerHectareReport(ledger, areaHectares);
  }

  /** The report needs the area of the plot. */
  hasArea(): boolean {
    return this.areaHectares > 0;
  }
}
