import { Money } from '../../../shared/domain/model/money';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { CampaignLedger } from '../../domain/model/entities/campaign-ledger.entity';
import { ExpenseCategory } from '../../domain/model/entities/expense-category';
import { ExpenseEntry } from '../../domain/model/entities/expense-entry.entity';
import { YieldUnit } from '../../domain/model/entities/yield-unit';
import { CampaignLedgerResource } from '../responses/campaign-ledger.response';
import { CampaignLedgersResponse } from '../responses/campaign-ledgers.response';
import { ExpenseEntryResource } from '../responses/expense-entry.response';

/**
 * Maps cost ledger entities (and their expenses) to and from API resources.
 */
export class CampaignLedgerAssembler implements BaseAssembler<
  CampaignLedger,
  CampaignLedgerResource,
  CampaignLedgersResponse
> {
  /**
   * Converts a CampaignLedgersResponse to an array of CampaignLedger entities.
   * @param response - The API response containing ledgers.
   * @returns An array of CampaignLedger entities.
   */
  toEntitiesFromResponse = (response: CampaignLedgersResponse): CampaignLedger[] =>
    response.ledgers.map((resource) => this.toEntityFromResource(resource));

  /**
   * Converts a CampaignLedgerResource to a CampaignLedger entity.
   * @param resource - The resource to convert.
   * @returns The converted CampaignLedger entity.
   */
  toEntityFromResource = (resource: CampaignLedgerResource): CampaignLedger =>
    new CampaignLedger({
      id: resource.id,
      campaignId: resource.campaignId,
      entries: (resource.entries ?? []).map((entry) => this.toExpenseEntry(entry, resource.id)),
      expectedYield: resource.expectedYield,
      actualYield: resource.actualYield,
      yieldUnit: resource.yieldUnit as YieldUnit,
      frozen: resource.frozen ?? false,
    });

  /**
   * Converts a CampaignLedger entity to a CampaignLedgerResource.
   * @param entity - The entity to convert.
   * @returns The converted CampaignLedgerResource.
   */
  toResourceFromEntity = (entity: CampaignLedger): CampaignLedgerResource => ({
    id: entity.id as number,
    campaignId: entity.campaignId,
    expectedYield: entity.expectedYield,
    actualYield: entity.actualYield,
    yieldUnit: entity.yieldUnit,
    frozen: entity.isFrozen(),
    entries: entity.entries.map((entry) => this.toExpenseResource(entry)),
  });

  /**
   * Converts an ExpenseEntryResource to an ExpenseEntry entity.
   * @param resource - The expense as the API sends it.
   * @param ledgerId - Ledger that owns the expense.
   */
  private toExpenseEntry = (resource: ExpenseEntryResource, ledgerId: number): ExpenseEntry =>
    new ExpenseEntry({
      id: resource.id,
      ledgerId,
      category: resource.category as ExpenseCategory,
      description: resource.description,
      quantity: resource.quantity,
      unitPrice: new Money(resource.unitPrice),
      expenseDate: toLocalDate(resource.expenseDate),
      notes: resource.notes,
      clientSyncId: resource.clientSyncId,
    });

  /**
   * Converts an ExpenseEntry entity to an ExpenseEntryResource.
   * @param entry - The expense to convert.
   */
  private toExpenseResource = (entry: ExpenseEntry): ExpenseEntryResource => ({
    id: entry.id as number,
    category: entry.category,
    description: entry.description,
    quantity: entry.quantity,
    unitPrice: entry.unitPrice.amount,
    expenseDate: toIsoDate(entry.expenseDate),
    notes: entry.notes,
    clientSyncId: entry.clientSyncId,
  });
}

/** Reads a `YYYY-MM-DD` date as a local date (avoids the time zone shift). */
function toLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Writes a date as `YYYY-MM-DD`. */
function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
