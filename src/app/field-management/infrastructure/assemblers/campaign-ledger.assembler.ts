import { Money } from '../../../shared/domain/model/money';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { CampaignLedger } from '../../domain/model/entities/campaign-ledger.entity';
import { ExpenseCategory } from '../../domain/model/entities/expense-category';
import { ExpenseEntry } from '../../domain/model/entities/expense-entry.entity';
import { YieldUnit } from '../../domain/model/entities/yield-unit';
import {
  CampaignLedgerResource,
  CampaignLedgersResponse,
  ExpenseEntryResource,
} from '../responses/campaign-ledger.response';

/** Maps cost ledgers (and their expenses) between the RESTful API and the domain. */
export class CampaignLedgerAssembler implements BaseAssembler<
  CampaignLedger,
  CampaignLedgerResource,
  CampaignLedgersResponse
> {
  toEntityFromResource(resource: CampaignLedgerResource): CampaignLedger {
    return new CampaignLedger({
      id: resource.id,
      campaignId: resource.campaignId,
      entries: (resource.entries ?? []).map((entry) => this.toExpenseEntry(entry, resource.id)),
      expectedYield: resource.expectedYield,
      actualYield: resource.actualYield,
      yieldUnit: resource.yieldUnit as YieldUnit,
      frozen: resource.frozen ?? false,
    });
  }

  toResourceFromEntity(entity: CampaignLedger): CampaignLedgerResource {
    return {
      id: entity.id as number,
      campaignId: entity.campaignId,
      expectedYield: entity.expectedYield,
      actualYield: entity.actualYield,
      yieldUnit: entity.yieldUnit,
      frozen: entity.isFrozen(),
      entries: entity.entries.map((entry) => this.toExpenseResource(entry)),
    };
  }

  toEntitiesFromResponse(response: CampaignLedgersResponse): CampaignLedger[] {
    return response.ledgers.map((resource) => this.toEntityFromResource(resource));
  }

  private toExpenseEntry(resource: ExpenseEntryResource, ledgerId: number): ExpenseEntry {
    return new ExpenseEntry({
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
  }

  private toExpenseResource(entry: ExpenseEntry): ExpenseEntryResource {
    return {
      id: entry.id as number,
      category: entry.category,
      description: entry.description,
      quantity: entry.quantity,
      unitPrice: entry.unitPrice.amount,
      expenseDate: toIsoDate(entry.expenseDate),
      notes: entry.notes,
      clientSyncId: entry.clientSyncId,
    };
  }
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
