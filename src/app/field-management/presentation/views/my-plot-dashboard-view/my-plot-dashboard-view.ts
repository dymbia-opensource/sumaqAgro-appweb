import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { map, startWith } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { FieldManagementStore } from '../../../application/field-management.store';
import { ExpenseCategory } from '../../../domain/model/entities/expense-category';

/** Order and translation key of each expense category in the cost chart. */
const CATEGORIES: { category: ExpenseCategory; label: string }[] = [
  { category: ExpenseCategory.INPUTS, label: 'field-management.expense-category.INPUTS' },
  { category: ExpenseCategory.LABOR, label: 'field-management.expense-category.LABOR' },
  { category: ExpenseCategory.FREIGHT, label: 'field-management.expense-category.FREIGHT' },
];

/**
 * "My Plot" dashboard: the start page of the producer.
 *
 * @remarks
 * It shows the selected plot with its active campaign, the total investment
 * and the breakeven price (US-16 to US-19). The leaf health card and the NDVI
 * chart belong to Crop Health and are added in that phase.
 */
@Component({
  selector: 'app-my-plot-dashboard-view',
  imports: [
    RouterLink,
    DecimalPipe,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    MatProgressBarModule,
    MatTooltipModule,
    BaseChartDirective,
    TranslatePipe,
  ],
  templateUrl: './my-plot-dashboard-view.html',
  styleUrl: './my-plot-dashboard-view.css',
})
export class MyPlotDashboardView {
  private readonly store = inject(FieldManagementStore);
  private readonly translate = inject(TranslateService);

  readonly userName = environment.demoUserName;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly plots = this.store.plots;
  readonly plot = this.store.selectedPlot;
  readonly campaign = this.store.activeCampaign;
  readonly ledger = this.store.ledger;

  /** i18n key of the greeting, depending on the time of day. */
  readonly greetingKey = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'field-management.dashboard.good-morning';
    if (hour < 19) return 'field-management.dashboard.good-afternoon';
    return 'field-management.dashboard.good-evening';
  });

  /** Total investment, cost per category and breakeven price of the active campaign. */
  readonly finances = computed(() => {
    const ledger = this.ledger();
    if (!ledger) return null;
    return {
      total: ledger.totalInvestment(),
      categories: CATEGORIES.map(({ category, label }) => ({
        label,
        amount: ledger.totalByCategory(category),
        percentage: ledger.percentageByCategory(category),
      })),
      breakeven: ledger.breakevenPrice(),
      minimumPrice: ledger.suggestedPrice(),
      expectedYield: ledger.expectedYield,
      yieldUnit: ledger.yieldUnit,
      firstExpenseDate: ledger.entries.at(-1)?.expenseDate ?? null,
    };
  });

  /** Changes every time the language changes, so the chart labels are translated again. */
  readonly language = toSignal(
    this.translate.onLangChange.pipe(
      map((event) => event.lang),
      startWith(this.translate.getCurrentLang()),
    ),
  );

  /** Data of the cost distribution doughnut chart. */
  readonly costChartData = computed<ChartConfiguration<'doughnut'>['data'] | null>(() => {
    this.language();
    const finances = this.finances();
    if (!finances || finances.total.amount === 0) return null;
    const colors = this.themeColors();
    return {
      labels: finances.categories.map((item) => this.translate.instant(item.label)),
      datasets: [
        {
          data: finances.categories.map((item) => item.amount.amount),
          backgroundColor: colors,
          hoverBackgroundColor: colors,
          borderWidth: 0,
        },
      ],
    };
  });

  /** Options of the doughnut chart: amounts in soles in the tooltip. */
  readonly costChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (item) =>
            ` ${new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
              item.parsed,
            )}`,
        },
      },
    },
  };

  /** Reloads the data when the API failed. */
  retry(): void {
    this.store.loadMyPlots(this.store.currentUserId());
  }

  /**
   * Colors of the chart, taken from the Angular Material theme.
   * The theme tokens use `light-dark()`, so the browser resolves them first.
   */
  private themeColors(): string[] {
    const probe = document.createElement('span');
    document.body.appendChild(probe);
    const colors = ['--mat-sys-primary', '--mat-sys-tertiary', '--mat-sys-tertiary-fixed-dim'].map(
      (token) => {
        probe.style.color = `var(${token})`;
        return getComputedStyle(probe).color;
      },
    );
    probe.remove();
    return colors;
  }
}
