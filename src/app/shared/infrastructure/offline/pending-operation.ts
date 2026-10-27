/** Kinds of operation that a context can keep on the device while it has no connection. */
export enum PendingOperationType {
  FIELD_EXPENSE = 'FIELD_EXPENSE',
  PEST_REPORT = 'PEST_REPORT',
}

/**
 * An operation recorded without connection, waiting to be sent to the RESTful API.
 *
 * @remarks
 * The `payload` belongs to the context that recorded the operation, which also
 * knows how to rebuild its command from it.
 */
export interface PendingOperation<TPayload = unknown> {
  /** Code generated on the device; the API uses it to ignore duplicates. */
  uuid: string;
  /** Kind of operation. */
  type: PendingOperationType;
  /** Data of the operation, as the owner context stored it. */
  payload: TPayload;
  /** Date and time (ISO 8601) when it was recorded. */
  createdAt: string;
}
