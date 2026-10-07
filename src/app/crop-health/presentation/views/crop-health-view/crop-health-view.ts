import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';

/**
 * Satellite Monitoring View — the main Crop Health screen.
 *
 * @remarks
 * Renders the NDVI / NDWI multispectral map together with the diagnostic
 * panel (average vigor, stressed area, and recommendation) for the
 * selected field plot.  Data is driven by {@link CropHealthStore}.
 */
@Component({
  selector: 'app-crop-health-view',
  imports: [
    DatePipe,
    DecimalPipe,
    TranslatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatRadioModule,
  ],
  templateUrl: './crop-health-view.html',
  styleUrl: './crop-health-view.css',
})
export class CropHealthView implements OnInit {
  /** Application store that holds all crop-health signals. */
  readonly store = inject(CropHealthStore);

  /**
   * Loads satellite observations for the default plot on component init.
   * Plot ID will be dynamic once the plot-selector is wired to the store.
   */
  ngOnInit(): void {
    this.store.loadObservations(1);
  }
}
