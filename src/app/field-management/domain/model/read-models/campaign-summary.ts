import { Money } from '../../../../shared/domain/model/money';
import { CampaignLedger } from '../entities/campaign-ledger.entity';
import { CampaignStatus } from '../entities/campaign-status';
import { CropCampaign } from '../entities/crop-campaign.entity';
import { CropType } from '../entities/crop-type';
import { YieldUnit } from '../entities/yield-unit';

/**
 * `CampaignSummary` read model: one campaign of a plot with the main figures
 * of its cost ledger.
 */
export class CampaignSummary {
  readonly campaignId: number;
  readonly plotId: number;
  readonly season: string;
  readonly cropType: CropType;
  readonly seedVariety: string;
  readonly sowingDate: Date | null;
  readonly status: CampaignStatus;
  /** `null` when the campaign has no cost ledger yet. */
  readonly ledgerId: number | null;
  readonly totalInvestment: Money;
  readonly breakevenPrice: Money;
  readonly expectedYield: number;
  readonly actualYield: number | null;
  readonly yieldUnit: YieldUnit;
  readonly expenseCount: number;
  readonly costPerHectare: Money;

  private constructor(campaign: CropCampaign, ledger: CampaignLedger | null, areaHectares: number) {
    this.campaignId = campaign.id as number;
    this.plotId = campaign.plotId;
    this.season = campaign.season;
    this.cropType = campaign.cropType;
    this.seedVariety = campaign.seedVariety;
    this.sowingDate = campaign.sowingDate;
    this.status = campaign.status;
    this.ledgerId = ledger ? (ledger.id as number) : null;
    this.totalInvestment = ledger?.totalInvestment() ?? new Money(0);
    this.breakevenPrice = ledger?.breakevenPrice() ?? new Money(0);
    this.expectedYield = ledger?.expectedYield ?? 0;
    this.actualYield = ledger?.actualYield ?? null;
    this.yieldUnit = ledger?.yieldUnit ?? CampaignLedger.yieldUnitOf(campaign.cropType);
    this.expenseCount = ledger?.entries.length ?? 0;
    this.costPerHectare = ledger?.costPerHectare(areaHectares) ?? new Money(0);
  }

  /**
   * Builds the summary of a campaign.
   * @param campaign - The campaign.
   * @param ledger - Its cost ledger, if it has one.
   * @param areaHectares - Area of the plot, for the cost per hectare.
   */
  static of(campaign: CropCampaign, ledger: CampaignLedger | null, areaHectares: number): CampaignSummary {
    return new CampaignSummary(campaign, ledger, areaHectares);
  }

  /** `true` while the campaign is in progress. */
  isActive(): boolean {
    return this.status === CampaignStatus.IN_PROGRESS;
  }

  /** Actual yield compared with the expected one, in % (100 = as expected), or `null`. */
  yieldAchievement(): number | null {
    if (this.actualYield === null || this.expectedYield <= 0) return null;
    return (this.actualYield / this.expectedYield) * 100;
  }
}
