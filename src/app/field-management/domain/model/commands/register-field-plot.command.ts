/**
 * Registers a new plot for the producer.
 */
export class RegisterFieldPlotCommand {
  /** Producer who owns the plot. */
  readonly ownerUserId: number;
  /** Name of the plot. */
  readonly name: string;
  /** Region or valley of the plot. */
  readonly region: string;

  constructor(props: { ownerUserId: number; name: string; region: string }) {
    this.ownerUserId = props.ownerUserId;
    this.name = props.name;
    this.region = props.region;
  }
}
