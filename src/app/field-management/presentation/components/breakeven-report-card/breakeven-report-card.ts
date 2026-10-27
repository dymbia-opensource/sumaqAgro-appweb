import { Component, computed, input, signal, inject } from '@angular/core';
import { FieldManagementStore } from '../../../application/field-management.store';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { TranslatePipe } from '@ngx-translate/core';
import { Money } from '../../../../shared/domain/model/money';
import { CampaignLedger } from '../../../domain/model/entities/campaign-ledger.entity';

/**
 * `BreakevenReport` read model: breakeven price with the expected and the
 * actual yield, a suggested price with margin and a profit simulator (US-40).
 */
@Component({
  selector: 'app-breakeven-report-card',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSliderModule,
    TranslatePipe,
  ],
  templateUrl: './breakeven-report-card.html',
  styleUrl: './breakeven-report-card.css',
})
export class BreakevenReportCard {
  protected readonly store = inject(FieldManagementStore);

  readonly ledger = input.required<CampaignLedger>();

  /** Profit margin chosen by the producer, in %. */
  protected readonly margin = signal(15);

  /** Price per unit offered by the buyer, typed by the producer. */
  protected readonly salePrice = signal<number | null>(null);

  /** Breakeven price with the expected and with the actual yield (`BreakevenReport`). */
  protected readonly report = computed(() => {
    const ledger = this.ledger();
    const totalInvestment = this.store.totalInvestment(ledger);
    const priceFor = (yieldQuantity: number) =>
      yieldQuantity > 0
        ? totalInvestment.multiply(1 / yieldQuantity)
        : new Money(0, totalInvestment.currency);
    return {
      totalInvestment,
      expectedYield: ledger.expectedYield,
      actualYield: ledger.actualYield,
      yieldUnit: ledger.yieldUnit,
      expectedBreakevenPrice: priceFor(ledger.expectedYield),
      actualBreakevenPrice: ledger.actualYield === null ? null : priceFor(ledger.actualYield),
      calculable: this.store.referenceYield(ledger) > 0,
    };
  });

  protected readonly suggestedPrice = computed(() =>
    this.store.suggestedPrice(this.ledger(), this.margin()),
  );

  /** Profit (or loss) selling the whole harvest at the typed price. */
  protected readonly profit = computed(() => {
    const price = this.salePrice();
    if (price === null || price <= 0) return null;
    const amount =
      price * this.store.referenceYield(this.ledger()) -
      this.report().totalInvestment.amount;
    return { amount, money: new Money(Math.abs(amount), this.ledger().currency) };
  });
}
