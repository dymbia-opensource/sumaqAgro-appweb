/**
 * Records the daily wages paid to the field workers.
 */
export class RecordDailyLaborExpenseCommand {
  readonly ledgerId: number;
  /** Number of workers. */
  readonly workers: number;
  /** Number of days worked. */
  readonly days: number;
  /** Wage per worker per day, in soles. */
  readonly dailyWage: number;
  readonly expenseDate: Date;

  constructor(props: {
    ledgerId: number;
    workers: number;
    days: number;
    dailyWage: number;
    expenseDate: Date;
  }) {
    this.ledgerId = props.ledgerId;
    this.workers = props.workers;
    this.days = props.days;
    this.dailyWage = props.dailyWage;
    this.expenseDate = props.expenseDate;
  }
}
