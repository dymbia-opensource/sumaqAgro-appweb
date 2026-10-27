import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { TranslatePipe } from '@ngx-translate/core';
import { Money } from '../../../../shared/domain/model/money';
import { CampaignLedger } from '../../../domain/model/entities/campaign-ledger.entity';
import { BreakevenReport } from '../../../application/view-models/breakeven-report';

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
  readonly ledger = input.required<CampaignLedger>();

  /** Profit margin chosen by the producer, in %. */
  protected readonly margin = signal(15);

  /** Price per unit offered by the buyer, typed by the producer. */
  protected readonly salePrice = signal<number | null>(null);

  protected readonly report = computed(() => BreakevenReport.of(this.ledger()));

  protected readonly suggestedPrice = computed(() => this.report().suggestedPrice(this.margin()));

  /** Profit (or loss) selling the whole harvest at the typed price. */
  protected readonly profit = computed(() => {
    const price = this.salePrice();
    if (price === null || price <= 0) return null;
    const amount = this.report().profitAt(price);
    return { amount, money: new Money(Math.abs(amount), this.ledger().currency) };
  });
}
