import { DecimalPipe } from '@angular/common';
import { Component, computed, input, inject } from '@angular/core';
import { FieldManagementStore } from '../../../application/field-management.store';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { CampaignLedger } from '../../../domain/model/entities/campaign-ledger.entity';
import { ExpenseCategory } from '../../../domain/model/entities/expense-entry.entity';
import { EXPENSE_CATEGORY_ICONS } from '../ledger-summary-cards/ledger-summary-cards';

/** `CostPerHectareReport` read model: cost of each category per hectare of the plot. */
@Component({
  selector: 'app-cost-per-hectare-card',
  imports: [DecimalPipe, MatCardModule, MatIconModule, MatProgressBarModule, TranslatePipe],
  templateUrl: './cost-per-hectare-card.html',
  styleUrl: './cost-per-hectare-card.css',
})
export class CostPerHectareCard {
  protected readonly store = inject(FieldManagementStore);

  readonly ledger = input.required<CampaignLedger>();

  /** Area of the plot, in hectares. */
  readonly areaHectares = input.required<number>();

  protected readonly icons = EXPENSE_CATEGORY_ICONS;

  /** Cost of each category per hectare of the plot (`CostPerHectareReport`). */
  protected readonly report = computed(() => {
    const ledger = this.ledger();
    const areaHectares = this.areaHectares();
    return {
      areaHectares,
      hasArea: areaHectares > 0,
      rows: Object.values(ExpenseCategory).map((category) => ({
        category,
        total: this.store.totalByCategory(ledger, category),
        perHectare: this.store.costPerHectare(ledger, areaHectares, category),
        percentage: this.store.percentageByCategory(ledger, category),
      })),
      totalPerHectare: this.store.costPerHectare(ledger, areaHectares),
      yieldPerHectare: this.store.yieldPerHectare(ledger, areaHectares),
      yieldUnit: ledger.yieldUnit,
    };
  });
}
