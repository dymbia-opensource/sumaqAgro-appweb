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
}
