import { FieldManagementEvent } from './field-management.event';

/**
 * The area of a plot was calculated from its GPS polygon (US-29).
 */
export class PlotAreaCalculatedEvent extends FieldManagementEvent {
  /** Plot identifier. */
  readonly plotId: number;
  /** Area of the polygon, in hectares. */
  readonly areaHectares: number;

  constructor(props: { plotId: number; areaHectares: number }) {
    super();
    this.plotId = props.plotId;
    this.areaHectares = props.areaHectares;
  }
}
