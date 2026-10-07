import { DatePipe, NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';

/**
 * Prescriptions View (Agronomist/Producer).
 *
 * @remarks
 * Displays a history of all prescriptions issued for the crop campaign.
 */
@Component({
  selector: 'app-prescriptions-view',
  imports: [DatePipe, NgClass, TranslatePipe, MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './prescriptions-view.html',
  styleUrl: './prescriptions-view.css',
})
export class PrescriptionsView implements OnInit {
  /** Application store managing crop health state. */
  readonly store = inject(CropHealthStore);

  /** Loads prescription history on init. */
  ngOnInit(): void {
    console.log('Loading prescription history...');
  }
}
