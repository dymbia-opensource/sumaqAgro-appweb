import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { Money } from '../../../../shared/domain/model/money';
import { ExpenseCategory } from './expense-category';

/**
 * One expense of the cost ledger: inputs, daily labor or freight.
 */
export class ExpenseEntry extends BaseEntity {
  private _ledgerId: number;
  private _category: ExpenseCategory;
  private _description: string;
  private _quantity: number;
  private _unitPrice: Money;
  private _expenseDate: Date;
  private _notes: string;
  private _clientSyncId: string;

  constructor(props: {
    id: number;
    ledgerId: number;
    category: ExpenseCategory;
    description: string;
    quantity: number;
    unitPrice: Money;
    expenseDate: Date;
    notes?: string;
    clientSyncId?: string;
  }) {
    super({ id: props.id });
    if (props.quantity <= 0) {
      throw new Error('The quantity must be greater than zero.');
    }
    this._ledgerId = props.ledgerId;
    this._category = props.category;
    this._description = props.description;
    this._quantity = props.quantity;
    this._unitPrice = props.unitPrice;
    this._expenseDate = props.expenseDate;
    this._notes = props.notes ?? '';
    this._clientSyncId = props.clientSyncId ?? '';
  }

  get ledgerId(): number {
    return this._ledgerId;
  }

  get category(): ExpenseCategory {
    return this._category;
  }

  get description(): string {
    return this._description;
  }

  get quantity(): number {
    return this._quantity;
  }

  get unitPrice(): Money {
    return this._unitPrice;
  }

  get expenseDate(): Date {
    return this._expenseDate;
  }

  get notes(): string {
    return this._notes;
  }

  /** Code generated on the device when the expense was recorded offline. */
  get clientSyncId(): string {
    return this._clientSyncId;
  }

  /** Total of the expense: quantity × unit price. */
  total(): Money {
    return this._unitPrice.multiply(this._quantity);
  }
}
