/** Applies a promotional code to the amount to pay. */
export class ApplyCouponCommand {
  /** `null` while the user has no subscription yet. */
  readonly subscriptionId: number | null;
  readonly couponCode: string;

  constructor(props: { subscriptionId: number | null; couponCode: string }) {
    this.subscriptionId = props.subscriptionId;
    this.couponCode = props.couponCode;
  }
}
