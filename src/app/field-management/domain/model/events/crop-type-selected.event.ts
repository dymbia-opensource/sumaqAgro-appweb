import { CropType } from '../entities/crop-type';
import { FieldManagementEvent } from './field-management.event';

/**
 * The crop of a campaign was selected (US-33).
 */
export class CropTypeSelectedEvent extends FieldManagementEvent {
  /** Campaign identifier. */
  readonly campaignId: number;
  /** Selected crop. */
  readonly cropType: CropType;

  constructor(props: { campaignId: number; cropType: CropType }) {
    super();
    this.campaignId = props.campaignId;
    this.cropType = props.cropType;
  }
}
