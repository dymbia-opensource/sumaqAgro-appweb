import { Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { afterRenderEffect, Component, effect, ElementRef, inject, AfterViewInit, OnDestroy, signal, untracked, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';
import { CropPlotSelector } from '../../components/plot-selector/plot-selector';
import { observationCsv } from '../../../application/observation-report';
import * as L from 'leaflet';

@Component({
  selector: 'app-crop-health-view',
  imports: [DatePipe, DecimalPipe, TranslatePipe, FormsModule, MatButtonModule, MatCardModule,
    MatIconModule, MatProgressBarModule, MatRadioModule, CropPlotSelector],
  templateUrl: './crop-health-view.html', styleUrl: './crop-health-view.css',
})
export class CropHealthView implements AfterViewInit, OnDestroy {
  readonly store = inject(CropHealthStore);
  private readonly router = inject(Router);
  private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  private readonly mapReady = signal(false);
  private map?: L.Map;
  private sectorLayer?: L.Polygon;
  selectedLayer: 'ndvi' | 'ndwi' = 'ndvi';

  constructor() {
    effect(() => {
      const plot = this.store.selectedPlot();
      untracked(() => { if (plot) this.store.loadObservations(plot.id as number); });
    });
    afterRenderEffect(() => {
      this.store.selectedPlot();
      if (this.mapReady()) untracked(() => this.drawSector());
    });
  }
  ngAfterViewInit(): void {
    this.map = L.map(this.mapContainer().nativeElement).setView([-9.19, -75.015], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19,
    }).addTo(this.map);
    this.mapReady.set(true);
  }
  ngOnDestroy(): void { this.map?.remove(); }
  private drawSector(): void {
    if (!this.map) return;
    if (this.sectorLayer) { this.map.removeLayer(this.sectorLayer); this.sectorLayer = undefined; }
    const plot = this.store.selectedPlot();
    if (!plot?.hasPolygon()) { this.map.setView([-9.19, -75.015], 5); return; }
    const color = this.selectedLayer === 'ndvi' ? 'green' : 'blue';
    this.sectorLayer = L.polygon(plot.boundary.map(vertex => [vertex.latitude, vertex.longitude] as L.LatLngTuple), {
      color, fillColor: color, fillOpacity: 0.12,
    }).addTo(this.map);
    this.map.fitBounds(this.sectorLayer.getBounds(), { padding: [20, 20] });
    this.map.invalidateSize();
  }
  onLayerChange(): void { this.drawSector(); }
  consultAgronomist(): void { void this.router.navigate(['/crop-health/inbox']); }
  downloadReport(): void {
    const plot = this.store.selectedPlot();
    const observation = this.store.latestObservation();
    if (!plot || !observation || this.store.observationsLoading() || this.store.observationsError()) return;
    const url = URL.createObjectURL(new Blob([observationCsv(plot.name, observation)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'crop-health-' + plot.id + '-' + observation.date.slice(0, 10) + '.csv';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
