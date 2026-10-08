/** Updates the farmer's contact information. */
export class UpdateFarmerContactCommand {
  readonly phoneNumber: string;
  readonly email: string;

  constructor(props: { phoneNumber: string; email: string }) {
    this.phoneNumber = props.phoneNumber;
    this.email = props.email;
  }
}
