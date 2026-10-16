import { YieldUnit } from '../entities/yield-unit';

/**
 * Records the yield actually harvested (policy P10: when Harvest Certification
 * weighs the delivered batch, or when the producer closes the campaign).
 */
export class RecordActualYieldCommand {
  readonly ledgerId: number;
  readonly actualYield: number;
  readonly unit: YieldUnit;

  constructor(props: { ledgerId: number; actualYield: number; unit: YieldUnit }) {
    this.ledgerId = props.ledgerId;
    this.actualYield = props.actualYield;
    this.unit = props.unit;
  }
}
