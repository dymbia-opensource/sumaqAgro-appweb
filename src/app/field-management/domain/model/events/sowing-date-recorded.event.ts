import { FieldManagementEvent } from './field-management.event';

/**
 * The sowing date of a campaign was recorded (US-32). It triggers policy P4 in Crop Health.
 */
export class SowingDateRecordedEvent extends FieldManagementEvent {
  /** Campaign identifier. */
  readonly campaignId: number;
  /** Plot of the campaign. */
  readonly plotId: number;
  /** Sowing date. */
  readonly sowingDate: Date;

  constructor(props: { campaignId: number; plotId: number; sowingDate: Date }) {
    super();
    this.campaignId = props.campaignId;
    this.plotId = props.plotId;
    this.sowingDate = props.sowingDate;
  }
}
