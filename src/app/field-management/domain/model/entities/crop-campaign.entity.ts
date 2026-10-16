import { StartCropCampaignCommand } from '../commands/start-crop-campaign.command';
import { CropCampaignClosedEvent } from '../events/crop-campaign-closed.event';
import { CropCampaignStartedEvent } from '../events/crop-campaign-started.event';
import { CropTypeSelectedEvent } from '../events/crop-type-selected.event';
import { SeedVarietySpecifiedEvent } from '../events/seed-variety-specified.event';
import { SowingDateRecordedEvent } from '../events/sowing-date-recorded.event';
import { AggregateRoot } from './aggregate-root';
import { CampaignStatus } from './campaign-status';
import { CropType } from './crop-type';

/**
 * Crop campaign of a plot: the crop, the seed variety and the sowing date.
 *
 * @remarks
 * Aggregate root of the `CropCampaign` aggregate of the EventStorming. Its
 * commands are `StartCropCampaign`, `SelectCropType`, `SpecifySeedVariety`,
 * `RecordSowingDate` and `CloseCropCampaign`.
 */
export class CropCampaign extends AggregateRoot {
  private _plotId: number;
  private _season: string;
  private _cropType: CropType;
  private _seedVariety: string;
  private _customSeedVariety: boolean;
  private _sowingDate: Date | null;
  private _status: CampaignStatus;

  constructor(props: {
    id: number;
    plotId: number;
    season: string;
    cropType: CropType;
    seedVariety: string;
    customSeedVariety?: boolean;
    sowingDate?: Date | null;
    status?: CampaignStatus;
  }) {
    super({ id: props.id });
    this._plotId = props.plotId;
    this._season = props.season;
    this._cropType = props.cropType;
    this._seedVariety = props.seedVariety;
    this._customSeedVariety = props.customSeedVariety ?? false;
    this._sowingDate = props.sowingDate ?? null;
    this._status = props.status ?? CampaignStatus.IN_PROGRESS;
  }

  /**
   * Starts a new campaign on a plot.
   *
   * @remarks
   * A plot cannot have two campaigns in progress: the previous one must be
   * closed first. The crop starts as potato until `selectCropType` is applied.
   *
   * @param command - Plot and season of the campaign.
   * @param plotCampaigns - Campaigns the plot already has.
   * @returns The new campaign, with the `CropCampaignStarted` event.
   * @throws Error when the season is empty or the plot has a campaign in progress.
   */
  static start(command: StartCropCampaignCommand, plotCampaigns: CropCampaign[] = []): CropCampaign {
    const season = command.season.trim();
    if (!season) {
      throw new Error('The season of the campaign is required.');
    }
    if (plotCampaigns.some((campaign) => campaign.plotId === command.plotId && campaign.isActive())) {
      throw new Error('The plot already has a campaign in progress.');
    }
    const campaign = new CropCampaign({
      id: 0,
      plotId: command.plotId,
      season,
      cropType: CropType.ANDEAN_POTATO,
      seedVariety: '',
    });
    campaign.raise(new CropCampaignStartedEvent({ campaignId: 0, plotId: command.plotId, season }));
    return campaign;
  }

  get plotId(): number {
    return this._plotId;
  }

  /** Agricultural season (for example, `2026-I`). */
  get season(): string {
    return this._season;
  }

  get cropType(): CropType {
    return this._cropType;
  }

  get seedVariety(): string {
    return this._seedVariety;
  }

  /** `true` when the producer typed a variety that is not in the catalog. */
  get customSeedVariety(): boolean {
    return this._customSeedVariety;
  }

  get sowingDate(): Date | null {
    return this._sowingDate;
  }

  get status(): CampaignStatus {
    return this._status;
  }

  /** `true` while the campaign is in progress. */
  isActive(): boolean {
    return this._status === CampaignStatus.IN_PROGRESS;
  }

  /**
   * Days since the sowing date, or `null` if the crop is not sown yet.
   * @param today - Reference date; today by default.
   */
  daysSinceSowing(today: Date = new Date()): number | null {
    if (!this._sowingDate) return null;
    const day = 24 * 60 * 60 * 1000;
    return Math.max(Math.floor((today.getTime() - this._sowingDate.getTime()) / day), 0);
  }

  /**
   * Sets the crop of the campaign: Andean potato or specialty coffee (US-33).
   * @param cropType - Crop of the campaign.
   */
  selectCropType(cropType: CropType): void {
    this.ensureActive();
    this._cropType = cropType;
    this.raise(new CropTypeSelectedEvent({ campaignId: this.id as number, cropType }));
  }

  /**
   * Sets the seed variety, from the catalog or typed by the producer (US-34).
   * @param varietyName - Name of the variety, for example `Canchán`.
   * @param custom - `true` when the variety is not in the catalog.
   * @throws Error when the name is empty.
   */
  specifySeedVariety(varietyName: string, custom: boolean = false): void {
    this.ensureActive();
    const name = varietyName.trim();
    if (!name) {
      throw new Error('The seed variety is required.');
    }
    this._seedVariety = name;
    this._customSeedVariety = custom;
    this.raise(
      new SeedVarietySpecifiedEvent({ campaignId: this.id as number, varietyName: name, custom }),
    );
  }

  /**
   * Records the date when the crop is sown (US-32). It starts the satellite
   * monitoring of the plot in Crop Health (policy P4).
   * @param sowingDate - Sowing date.
   * @throws Error when the date is not valid.
   */
  recordSowingDate(sowingDate: Date): void {
    this.ensureActive();
    if (Number.isNaN(sowingDate.getTime())) {
      throw new Error('The sowing date is not valid.');
    }
    this._sowingDate = sowingDate;
    this.raise(
      new SowingDateRecordedEvent({
        campaignId: this.id as number,
        plotId: this._plotId,
        sowingDate,
      }),
    );
  }

  /**
   * Closes the campaign after the harvest; it becomes read only and its cost
   * ledger stops accepting expenses.
   * @throws Error when the campaign is already closed.
   */
  close(): void {
    this.ensureActive();
    this._status = CampaignStatus.FINISHED;
    this.raise(new CropCampaignClosedEvent({ campaignId: this.id as number, plotId: this._plotId }));
  }

  /** Copy of the campaign without its pending events, to change it before the API confirms. */
  clone(): CropCampaign {
    return new CropCampaign({
      id: this.id as number,
      plotId: this._plotId,
      season: this._season,
      cropType: this._cropType,
      seedVariety: this._seedVariety,
      customSeedVariety: this._customSeedVariety,
      sowingDate: this._sowingDate,
      status: this._status,
    });
  }

  /**
   * Agricultural season of a date: `YYYY-I` from January to June, `YYYY-II` from July.
   * @param date - Sowing date.
   */
  static seasonOf(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() < 6 ? 'I' : 'II'}`;
  }

  /** A finished campaign is read only. */
  private ensureActive(): void {
    if (!this.isActive()) {
      throw new Error('A finished campaign cannot be changed.');
    }
  }
}
