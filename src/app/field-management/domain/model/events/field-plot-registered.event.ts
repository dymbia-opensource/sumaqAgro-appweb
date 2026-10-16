import { FieldManagementEvent } from './field-management.event';

/**
 * A producer registered a new plot "without polygon" (US-28).
 */
export class FieldPlotRegisteredEvent extends FieldManagementEvent {
  /** Plot identifier (`0` until the API assigns one). */
  readonly plotId: number;
  /** Producer who owns the plot. */
  readonly ownerUserId: number;
  /** Name of the plot. */
  readonly name: string;

  constructor(props: { plotId: number; ownerUserId: number; name: string }) {
    super();
    this.plotId = props.plotId;
    this.ownerUserId = props.ownerUserId;
    this.name = props.name;
  }
}
