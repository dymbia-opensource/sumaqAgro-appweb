/**
 * Records the purchase of an input (seed, fertilizer, etc.).
 */
export class RecordInputExpenseCommand {
  readonly ledgerId: number;
  readonly inputName: string;
  readonly quantity: number;
  /** Price per unit, in soles. */
  readonly unitPrice: number;
  readonly expenseDate: Date;

  constructor(props: {
    ledgerId: number;
    inputName: string;
    quantity: number;
    unitPrice: number;
    expenseDate: Date;
  }) {
    this.ledgerId = props.ledgerId;
    this.inputName = props.inputName;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
    this.expenseDate = props.expenseDate;
  }
}
