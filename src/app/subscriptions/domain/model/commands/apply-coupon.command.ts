/** Applies a promotional code to the amount to pay. */
export class ApplyCouponCommand {
  readonly subscriptionId: number;
  readonly couponCode: string;

  constructor(props: { subscriptionId: number; couponCode: string }) {
    this.subscriptionId = props.subscriptionId;
    this.couponCode = props.couponCode;
  }
}
