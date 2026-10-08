import { DatePipe, NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';

/**
 * Agroclimatic Alerts View.
 *
 * @remarks
 * Lists all active weather and environmental alerts for the user's region.
 * Severity levels are reflected through CSS classes for visual distinction.
 */
@Component({
  selector: 'app-agricultural-alerts-view',
  imports: [DatePipe, NgClass, TranslatePipe, MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './agricultural-alerts-view.html',
  styleUrl: './agricultural-alerts-view.css',
})
export class AgriculturalAlertsView implements OnInit {
  /** Application store that holds all crop-health signals. */
  readonly store = inject(CropHealthStore);

  /** Loads agroclimatic alerts for the user's region on component init. */
  ngOnInit(): void {
    this.store.loadAlerts('Valle Sur');
  }
}
