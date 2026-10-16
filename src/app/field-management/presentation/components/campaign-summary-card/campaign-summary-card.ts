import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { CampaignSummary } from '../../../domain/model/read-models/campaign-summary';

/** Card of one campaign of the plot: crop, sowing, investment and yield (`CampaignSummary`). */
@Component({
  selector: 'app-campaign-summary-card',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './campaign-summary-card.html',
  styleUrl: './campaign-summary-card.css',
})
export class CampaignSummaryCard {
  readonly summary = input.required<CampaignSummary>();

  /** `true` while a change is being saved. */
  readonly saving = input(false);

  /** The producer wants to close the campaign. */
  readonly closeCampaign = output<CampaignSummary>();

  /** The producer wants to download the cost report. */
  readonly exportReport = output<CampaignSummary>();
}
