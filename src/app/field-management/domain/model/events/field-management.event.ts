/**
 * Base class for the domain events of Field Management.
 *
 * @remarks
 * The aggregates raise the events of the EventStorming when their state
 * changes. The store publishes them only after the API confirms the change,
 * so other contexts (for example Crop Health, policy P4) can react to them.
 */
export abstract class FieldManagementEvent {
  /** Date and time when the event happened. */
  readonly occurredOn: Date = new Date();
}
