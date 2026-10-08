import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';

/**
 * Field Inspections View (Agronomist).
 *
 * @remarks
 * Displays scheduled and completed field inspections.
 */
@Component({
  selector: 'app-field-inspections-view',
  imports: [TranslatePipe, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './field-inspections-view.html',
  styleUrl: './field-inspections-view.css',
})
export class FieldInspectionsView implements OnInit {
  /** Application store managing crop health state. */
  readonly store = inject(CropHealthStore);

  /** Loads inspections on init. */
  ngOnInit(): void {
    console.log('Loading field inspections...');
  }
}
