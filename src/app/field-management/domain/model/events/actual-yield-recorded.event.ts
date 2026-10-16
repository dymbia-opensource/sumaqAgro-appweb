import { YieldUnit } from '../entities/yield-unit';
import { FieldManagementEvent } from './field-management.event';

/**
 * The yield actually harvested was recorded (policy P10).
 */
export class ActualYieldRecordedEvent extends FieldManagementEvent {
  /** Ledger identifier. */
  readonly ledgerId: number;
  /** Harvested yield. */
  readonly actualYield: number;
  /** Unit of the yield. */
  readonly unit: YieldUnit;

  constructor(props: { ledgerId: number; actualYield: number; unit: YieldUnit }) {
    super();
    this.ledgerId = props.ledgerId;
    this.actualYield = props.actualYield;
    this.unit = props.unit;
  }
}
