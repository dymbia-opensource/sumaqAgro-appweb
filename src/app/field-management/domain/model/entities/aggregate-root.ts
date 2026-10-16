import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { FieldManagementEvent } from '../events/field-management.event';

/**
 * Base class for the aggregates of Field Management: `FieldPlot`,
 * `CropCampaign` and `CampaignLedger`.
 *
 * @remarks
 * It extends the shared {@link BaseEntity} without changing it: it only adds
 * the list of domain events raised by the commands of the aggregate. The
 * entities rebuilt by the assemblers start without events.
 */
export abstract class AggregateRoot extends BaseEntity {
  private _domainEvents: FieldManagementEvent[] = [];

  /** Events raised since the last time they were pulled. */
  get domainEvents(): FieldManagementEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Returns the raised events and forgets them, so each one is published once.
   */
  pullDomainEvents(): FieldManagementEvent[] {
    const events = this._domainEvents;
    this._domainEvents = [];
    return events;
  }

  /**
   * Records a domain event of the aggregate.
   * @param event - Event raised by a command.
   */
  protected raise(event: FieldManagementEvent): void {
    this._domainEvents = [...this._domainEvents, event];
  }
}
