import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';
import * as L from 'leaflet';

/**
 * Satellite Monitoring View — the main Crop Health screen.
 */
@Component({
  selector: 'app-crop-health-view',
  imports: [
    DatePipe,
    DecimalPipe,
    TranslatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatRadioModule,
  ],
  templateUrl: './crop-health-view.html',
  styleUrl: './crop-health-view.css',
})
export class CropHealthView implements OnInit, AfterViewInit, OnDestroy {
  readonly store = inject(CropHealthStore);

  private map: L.Map | undefined;
  private sectorLayer: L.Polygon | undefined;

  /** Selected layer type */
  selectedLayer: 'ndvi' | 'ndwi' = 'ndvi';

  ngOnInit(): void {
    this.store.loadObservations(1);
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    // Initial map centered over a sample plot coordinate
    this.map = L.map('crop-map').setView([-13.4243, -76.0007], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Initial polygon representing the plot sector
    this.drawSector();
  }

  private drawSector(): void {
    if (!this.map) return;

    if (this.sectorLayer) {
      this.map.removeLayer(this.sectorLayer);
    }

    const latlngs: L.LatLngExpression[] = [
      [-13.422, -76.004],
      [-13.422, -75.996],
      [-13.427, -75.996],
      [-13.427, -76.004]
    ];

    const color = this.selectedLayer === 'ndvi' ? 'green' : 'blue';

    this.sectorLayer = L.polygon(latlngs, {
      color: color,
      fillColor: color,
      fillOpacity: 0.4
    }).addTo(this.map);
    
    // Auto-fit to the plot area
    this.map.fitBounds(this.sectorLayer.getBounds(), { padding: [20, 20] });
  }

  /**
   * Called when the user switches between NDVI and NDWI
   */
  onLayerChange(): void {
    this.drawSector();
  }

  consultAgronomist(): void {
    console.log('Consult agronomist clicked');
  }

  downloadReport(): void {
    console.log('Download report clicked');
  }
}
