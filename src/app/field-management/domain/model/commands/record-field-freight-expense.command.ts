/**
 * Records a freight cost (inputs or harvest transport).
 */
export class RecordFieldFreightExpenseCommand {
  readonly ledgerId: number;
  /** For example, "Chacra – Acopio". */
  readonly route: string;
  /** Total cost, in soles. */
  readonly cost: number;
  readonly expenseDate: Date;

  constructor(props: { ledgerId: number; route: string; cost: number; expenseDate: Date }) {
    this.ledgerId = props.ledgerId;
    this.route = props.route;
    this.cost = props.cost;
    this.expenseDate = props.expenseDate;
  }
}
