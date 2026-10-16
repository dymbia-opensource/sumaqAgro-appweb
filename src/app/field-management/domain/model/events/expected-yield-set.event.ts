import { YieldUnit } from '../entities/yield-unit';
import { FieldManagementEvent } from './field-management.event';

/**
 * The producer set the yield expected for the campaign (US-40). It triggers policy P9.
 */
export class ExpectedYieldSetEvent extends FieldManagementEvent {
  /** Ledger identifier. */
  readonly ledgerId: number;
  /** Expected yield. */
  readonly expectedYield: number;
  /** Unit of the yield. */
  readonly unit: YieldUnit;

  constructor(props: { ledgerId: number; expectedYield: number; unit: YieldUnit }) {
    super();
    this.ledgerId = props.ledgerId;
    this.expectedYield = props.expectedYield;
    this.unit = props.unit;
  }
}
