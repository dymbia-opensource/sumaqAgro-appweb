import { Money } from '../../../shared/domain/model/money';
import { CampaignLedger } from '../../domain/model/entities/campaign-ledger.entity';
import { YieldUnit } from '../../domain/model/entities/yield-unit';

/**
 * `BreakevenReport` read model: the breakeven price of a campaign with the
 * expected and the actual yield, and the profit at a sale price (US-40).
 */
export class BreakevenReport {
  readonly totalInvestment: Money;
  readonly expectedYield: number;
  readonly actualYield: number | null;
  readonly yieldUnit: YieldUnit;
  /** Breakeven price with the expected yield. */
  readonly expectedBreakevenPrice: Money;
  /** Breakeven price with the actual yield, or `null` before the harvest. */
  readonly actualBreakevenPrice: Money | null;

  private constructor(private readonly ledger: CampaignLedger) {
    this.totalInvestment = ledger.totalInvestment();
    this.expectedYield = ledger.expectedYield;
    this.actualYield = ledger.actualYield;
    this.yieldUnit = ledger.yieldUnit;
    this.expectedBreakevenPrice = BreakevenReport.priceFor(this.totalInvestment, ledger.expectedYield);
    this.actualBreakevenPrice =
      ledger.actualYield === null ? null : BreakevenReport.priceFor(this.totalInvestment, ledger.actualYield);
  }

  /**
   * Builds the report of a cost ledger.
   * @param ledger - Cost ledger of the campaign.
   */
  static of(ledger: CampaignLedger): BreakevenReport {
    return new BreakevenReport(ledger);
  }

  /** `true` when there is a yield to calculate the price. */
  isCalculable(): boolean {
    return this.ledger.referenceYield() > 0;
  }

  /**
   * Minimum sale price plus a margin, rounded up.
   * @param marginPercentage - Expected profit, for example `15` for 15 %.
   */
  suggestedPrice(marginPercentage: number): Money {
    return this.ledger.suggestedPrice(marginPercentage);
  }

  /**
   * Profit (positive) or loss (negative) if the whole harvest is sold at a price.
   * @param salePrice - Price per unit.
   */
  profitAt(salePrice: number): number {
    return salePrice * this.ledger.referenceYield() - this.totalInvestment.amount;
  }

  private static priceFor(total: Money, yieldQuantity: number): Money {
    return yieldQuantity > 0 ? total.multiply(1 / yieldQuantity) : new Money(0, total.currency);
  }
}
