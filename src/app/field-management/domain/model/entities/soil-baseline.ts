import { CropType } from './crop-type';
import { SoilTexture } from './soil-texture';

/**
 * Initial soil analysis of a plot: pH, texture and organic matter.
 *
 * @remarks
 * It is a value that belongs to {@link FieldPlot}; it has no identity of its
 * own and it is immutable. A new analysis replaces the previous one.
 */
export class SoilBaseline {
  private readonly _ph: number;
  private readonly _texture: SoilTexture;
  private readonly _organicMatterPercentage: number;
  private readonly _recordedAt: Date;

  /** Lowest pH each crop tolerates before the soil needs lime. */
  private static readonly MINIMUM_PH: Record<CropType, number> = {
    [CropType.ANDEAN_POTATO]: 5.5,
    [CropType.SPECIALTY_COFFEE]: 5.0,
  };

  /**
   * Creates a soil analysis.
   * @param props.ph - pH of the soil, between 0 and 14.
   * @param props.texture - Texture of the soil.
   * @param props.organicMatterPercentage - Organic matter, between 0 and 100.
   * @param props.recordedAt - Date of the analysis; it cannot be in the future.
   * @throws Error when a value is out of range.
   */
  constructor(props: {
    ph: number;
    texture: SoilTexture;
    organicMatterPercentage: number;
    recordedAt: Date;
  }) {
    if (!Number.isFinite(props.ph) || props.ph < 0 || props.ph > 14) {
      throw new Error('The soil pH must be between 0 and 14.');
    }
    if (
      !Number.isFinite(props.organicMatterPercentage) ||
      props.organicMatterPercentage < 0 ||
      props.organicMatterPercentage > 100
    ) {
      throw new Error('The organic matter must be between 0 and 100 %.');
    }
    if (props.recordedAt.getTime() > Date.now()) {
      throw new Error('The date of the soil analysis cannot be in the future.');
    }
    this._ph = props.ph;
    this._texture = props.texture;
    this._organicMatterPercentage = props.organicMatterPercentage;
    this._recordedAt = props.recordedAt;
  }

  get ph(): number {
    return this._ph;
  }

  get texture(): SoilTexture {
    return this._texture;
  }

  get organicMatterPercentage(): number {
    return this._organicMatterPercentage;
  }

  get recordedAt(): Date {
    return this._recordedAt;
  }

  /**
   * `true` when the soil is too acid for the crop and needs lime before sowing.
   * @param cropType - Crop that will be sown.
   */
  needsLiming(cropType: CropType): boolean {
    return this._ph < SoilBaseline.MINIMUM_PH[cropType];
  }

  /** `true` when the soil has less than 2 % of organic matter and needs compost. */
  isLowInOrganicMatter(): boolean {
    return this._organicMatterPercentage < 2;
  }
}
