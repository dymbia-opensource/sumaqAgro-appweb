import { computed, Injectable, signal } from '@angular/core';
import { fromApiDate, toApiDate } from '../../../shared/infrastructure/api-date';
import { RecordDailyLaborExpenseCommand } from '../../domain/model/commands/record-daily-labor-expense.command';
import { RecordFieldFreightExpenseCommand } from '../../domain/model/commands/record-field-freight-expense.command';
import { RecordInputExpenseCommand } from '../../domain/model/commands/record-input-expense.command';
import { ExpenseCategory } from '../../domain/model/entities/expense-category';

/** Any of the three expense commands of the cost ledger. */
export type ExpenseCommand =
  | RecordInputExpenseCommand
  | RecordDailyLaborExpenseCommand
  | RecordFieldFreightExpenseCommand;

/** An expense command as it is kept on the device (dates as `YYYY-MM-DD`). */
type PendingExpenseRecord =
  | { category: ExpenseCategory.INPUTS; ledgerId: number; clientSyncId: string; expenseDate: string; inputName: string; quantity: number; unitPrice: number }
  | { category: ExpenseCategory.LABOR; ledgerId: number; clientSyncId: string; expenseDate: string; activity: string; workers: number; days: number; dailyWage: number }
  | { category: ExpenseCategory.FREIGHT; ledgerId: number; clientSyncId: string; expenseDate: string; route: string; cost: number };

const STORAGE_KEY = 'sumaq-agro-pending-expenses';

/**
 * Expenses recorded without connection, kept on the device until they are
 * synchronized with the RESTful API.
 *
 * @remarks
 * Each command keeps its `clientSyncId`, so the cost ledger ignores an
 * expense that was already saved (for example, if the page closes in the
 * middle of a synchronization).
 */
@Injectable({ providedIn: 'root' })
export class OfflineExpenseQueue {
  private readonly recordsSignal = signal<PendingExpenseRecord[]>(OfflineExpenseQueue.read());

  /** Number of expenses waiting to be synchronized. */
  readonly size = computed(() => this.recordsSignal().length);

  /**
   * Keeps an expense on the device.
   * @param command - The expense recorded without connection.
   */
  enqueue(command: ExpenseCommand): void {
    this.write([...this.recordsSignal(), OfflineExpenseQueue.toRecord(command)]);
  }

  /**
   * Pending expenses of one ledger, in the order they were recorded.
   * @param ledgerId - Cost ledger of the expenses.
   */
  pendingOf(ledgerId: number): ExpenseCommand[] {
    return this.recordsSignal()
      .filter((record) => record.ledgerId === ledgerId)
      .map(OfflineExpenseQueue.toCommand);
  }

  /** Ledgers that have pending expenses. */
  pendingLedgerIds(): number[] {
    return [...new Set(this.recordsSignal().map((record) => record.ledgerId))];
  }

  /**
   * Forgets the expenses already saved in the API.
   * @param clientSyncIds - Device codes of the synchronized expenses.
   */
  remove(clientSyncIds: string[]): void {
    this.write(this.recordsSignal().filter((record) => !clientSyncIds.includes(record.clientSyncId)));
  }

  private write(records: PendingExpenseRecord[]): void {
    this.recordsSignal.set(records);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // Without storage the expenses stay in memory until the page closes.
    }
  }

  private static read(): PendingExpenseRecord[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as PendingExpenseRecord[];
    } catch {
      return [];
    }
  }

  private static toRecord(command: ExpenseCommand): PendingExpenseRecord {
    const base = {
      ledgerId: command.ledgerId,
      clientSyncId: command.clientSyncId,
      expenseDate: toApiDate(command.expenseDate),
    };
    if (command instanceof RecordInputExpenseCommand) {
      return { ...base, category: ExpenseCategory.INPUTS, inputName: command.inputName, quantity: command.quantity, unitPrice: command.unitPrice };
    }
    if (command instanceof RecordDailyLaborExpenseCommand) {
      return { ...base, category: ExpenseCategory.LABOR, activity: command.activity, workers: command.workers, days: command.days, dailyWage: command.dailyWage };
    }
    return { ...base, category: ExpenseCategory.FREIGHT, route: command.route, cost: command.cost };
  }

  private static toCommand(record: PendingExpenseRecord): ExpenseCommand {
    const expenseDate = fromApiDate(record.expenseDate);
    switch (record.category) {
      case ExpenseCategory.INPUTS:
        return new RecordInputExpenseCommand({ ...record, expenseDate });
      case ExpenseCategory.LABOR:
        return new RecordDailyLaborExpenseCommand({ ...record, expenseDate });
      case ExpenseCategory.FREIGHT:
        return new RecordFieldFreightExpenseCommand({ ...record, expenseDate });
    }
  }
}
