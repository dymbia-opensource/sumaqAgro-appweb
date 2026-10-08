import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { CampaignStatus } from './campaign-status';
import { CropType } from './crop-type';

/**
 * Crop campaign of a plot: the crop, the seed variety and the sowing date.
 */
export class CropCampaign extends BaseEntity {
  private _plotId: number;
  private _season: string;
  private _cropType: CropType;
  private _seedVariety: string;
  private _sowingDate: Date | null;
  private _status: CampaignStatus;

  constructor(props: {
    id: number;
    plotId: number;
    season: string;
    cropType: CropType;
    seedVariety: string;
    sowingDate?: Date | null;
    status?: CampaignStatus;
  }) {
    super({ id: props.id });
    this._plotId = props.plotId;
    this._season = props.season;
    this._cropType = props.cropType;
    this._seedVariety = props.seedVariety;
    this._sowingDate = props.sowingDate ?? null;
    this._status = props.status ?? CampaignStatus.IN_PROGRESS;
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
   * Sets the crop of the campaign: Andean potato or specialty coffee (US-33).
   * @param cropType - Crop of the campaign.
   */
  selectCropType(cropType: CropType): void {
    this.ensureActive();
    this._cropType = cropType;
  }

  /**
   * Sets the seed variety, from the catalog or typed by the producer (US-34).
   * @param varietyName - Name of the variety, for example `Canchán`.
   * @throws Error when the name is empty.
   */
  specifySeedVariety(varietyName: string): void {
    this.ensureActive();
    const name = varietyName.trim();
    if (!name) {
      throw new Error('The seed variety is required.');
    }
    this._seedVariety = name;
  }

  /**
   * Records the date when the crop is sown (US-32).
   * @param sowingDate - Sowing date.
   */
  recordSowingDate(sowingDate: Date): void {
    this.ensureActive();
    this._sowingDate = sowingDate;
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
