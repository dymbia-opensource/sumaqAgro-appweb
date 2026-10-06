import { CropType } from './crop-type';

/**
 * Initial soil analysis of a plot.
 *
 * @remarks
 * It is a value that belongs to {@link FieldPlot}; it has no identity of its own.
 */
export class SoilBaseline {
  private readonly _ph: number;
  private readonly _texture: string;
  private readonly _organicMatterPercentage: number;
  private readonly _recordedAt: Date;

  constructor(props: {
    ph: number;
    texture: string;
    organicMatterPercentage: number;
    recordedAt: Date;
  }) {
    this._ph = props.ph;
    this._texture = props.texture;
    this._organicMatterPercentage = props.organicMatterPercentage;
    this._recordedAt = props.recordedAt;
  }

  get ph(): number {
    return this._ph;
  }

  get texture(): string {
    return this._texture;
  }

  get organicMatterPercentage(): number {
    return this._organicMatterPercentage;
  }

  get recordedAt(): Date {
    return this._recordedAt;
  }

  /**
   * Tells whether the soil is too acid for the crop and needs lime.
   * Potato grows well from pH 5.0 and coffee from pH 5.5.
   * @param cropType - Crop that will be sown.
   */
  needsLiming(cropType: CropType): boolean {
    const minimumPh = cropType === CropType.SPECIALTY_COFFEE ? 5.5 : 5.0;
    return this._ph < minimumPh;
  }
}
