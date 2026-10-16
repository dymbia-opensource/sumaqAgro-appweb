import { SoilBaseline } from '../entities/soil-baseline';
import { FieldManagementEvent } from './field-management.event';

/**
 * The initial soil analysis of a plot was recorded.
 */
export class SoilBaselineRecordedEvent extends FieldManagementEvent {
  /** Plot identifier. */
  readonly plotId: number;
  /** Soil analysis of the plot. */
  readonly soilBaseline: SoilBaseline;

  constructor(props: { plotId: number; soilBaseline: SoilBaseline }) {
    super();
    this.plotId = props.plotId;
    this.soilBaseline = props.soilBaseline;
  }
}
