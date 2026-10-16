import { FieldManagementEvent } from './field-management.event';

/**
 * The seed variety of a campaign was specified (US-34).
 */
export class SeedVarietySpecifiedEvent extends FieldManagementEvent {
  /** Campaign identifier. */
  readonly campaignId: number;
  /** Name of the variety. */
  readonly varietyName: string;
  /** `true` when the variety is not in the catalog. */
  readonly custom: boolean;

  constructor(props: { campaignId: number; varietyName: string; custom: boolean }) {
    super();
    this.campaignId = props.campaignId;
    this.varietyName = props.varietyName;
    this.custom = props.custom;
  }
}
