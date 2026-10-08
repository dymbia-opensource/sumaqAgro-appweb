import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';

/**
 * Diagnosis Inbox View (Agronomist).
 *
 * @remarks
 * Displays a list of pending pest and disease reports submitted by producers.
 * Agronomists can review these and schedule an inspection or issue a prescription.
 */
@Component({
  selector: 'app-diagnosis-inbox-view',
  imports: [TranslatePipe, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './diagnosis-inbox-view.html',
  styleUrl: './diagnosis-inbox-view.css',
})
export class DiagnosisInboxView implements OnInit {
  /** Application store managing crop health state. */
  readonly store = inject(CropHealthStore);

  /** Loads pending pest reports on component initialization. */
  ngOnInit(): void {
    console.log('Loading pending pest reports for the inbox...');
  }
}
