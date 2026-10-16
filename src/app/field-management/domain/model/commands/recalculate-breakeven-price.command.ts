/**
 * Calculates again the total investment and the breakeven price of a ledger
 * (policy P9: after every expense or a new expected yield).
 */
export class RecalculateBreakevenPriceCommand {
  readonly ledgerId: number;

  constructor(props: { ledgerId: number }) {
    this.ledgerId = props.ledgerId;
  }
}
