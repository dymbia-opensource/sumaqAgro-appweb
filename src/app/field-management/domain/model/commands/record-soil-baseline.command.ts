/**
 * Records the initial soil analysis of a plot.
 */
export class RecordSoilBaselineCommand {
  readonly plotId: number;
  readonly ph: number;
  readonly texture: string;
  readonly organicMatterPercentage: number;

  constructor(props: {
    plotId: number;
    ph: number;
    texture: string;
    organicMatterPercentage: number;
  }) {
    this.plotId = props.plotId;
    this.ph = props.ph;
    this.texture = props.texture;
    this.organicMatterPercentage = props.organicMatterPercentage;
  }
}
