/**
 * Promotional codes accepted while there is no backend.
 *
 * @remarks
 * Temporary: the RESTful API will validate the coupon. The value is the
 * percentage discounted from the final price.
 */
export const DEMO_COUPONS: Readonly<Record<string, number>> = {
  SUMAQ10: 10,
  COSECHA20: 20,
};
