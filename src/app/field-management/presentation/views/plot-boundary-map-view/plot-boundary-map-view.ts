import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import * as L from 'leaflet';
import { FieldManagementStore } from '../../../application/field-management.store';
import { DelineatePlotBoundaryCommand } from '../../../domain/model/commands/delineate-plot-boundary.command';
import { FieldPlot } from '../../../domain/model/entities/field-plot.entity';
import { GeoCoordinate } from '../../../domain/model/entities/geo-coordinate.entity';

/** Center used when the plot has no polygon yet (Valle del Mantaro, Junín). */
const DEFAULT_CENTER: L.LatLngExpression = [-12.0725, -75.2121];

/** Base layers of the map. */
type MapLayer = 'satellite' | 'streets';

/** Status of the polygon being marked. */
type PolygonStatus = 'OPEN' | 'CLOSED' | 'CROSSED';

/**
 * Step 2 of 2 of the plot registration: the producer marks the corners of the
 * plot on a satellite map (US-29, US-30).
 *
 * @remarks
 * The vertices are added by clicking the map, by searching GPS coordinates or
 * with the location of the phone. The {@link FieldPlot} entity calculates the
 * area and checks that the sides do not cross.
 */
@Component({
  selector: 'app-plot-boundary-map-view',
  imports: [
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    TranslatePipe,
  ],
  templateUrl: './plot-boundary-map-view.html',
  styleUrl: './plot-boundary-map-view.css',
})
export class PlotBoundaryMapView implements AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private fieldManagementStore = inject(FieldManagementStore);

  private readonly mapElement = viewChild.required<ElementRef<HTMLDivElement>>('mapElement');
  private readonly savedDialog = viewChild.required<TemplateRef<unknown>>('savedDialog');

  private map?: L.Map;
  private readonly baseLayers: Record<MapLayer, L.Layer> = {
    satellite: L.layerGroup([
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 17, attribution: 'Tiles © Esri — Esri, Maxar, Earthstar Geographics' },
      ),
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 17 },
      ),
    ]),
    streets: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }),
  };
  private readonly drawingLayer = L.layerGroup();
  private loadedPlotId: number | null = null;

  readonly loading = this.fieldManagementStore.loading;
  readonly error = this.fieldManagementStore.error;

  /** The ID of the plot being delineated. */
  plotId = 0;

  /** Plot being delineated. */
  readonly plot = computed(() => this.fieldManagementStore.getPlotById(this.plotId)());

  /** Campaign of the plot, to show its crop. */
  readonly campaign = computed(() =>
    this.fieldManagementStore.getCurrentCampaignOf(this.plotId)(),
  );

  /** Vertices marked on the map, in order. */
  readonly markedCoordinates = signal<GeoCoordinate[]>([]);

  /** Area of the polygon, calculated while marking (US-29). */
  readonly areaHectares = computed(() =>
    FieldPlot.calculateAreaHectares(this.markedCoordinates()),
  );

  /** Open, closed (it can be saved) or crossed (the sides cross each other). */
  readonly polygonStatus = computed<PolygonStatus>(() => {
    const coordinates = this.markedCoordinates();
    if (coordinates.length < FieldPlot.MINIMUM_VERTICES) return 'OPEN';
    return FieldPlot.isSimplePolygon(coordinates) ? 'CLOSED' : 'CROSSED';
  });

  /** Base layer shown on the map. */
  readonly layer = signal<MapLayer>('satellite');

  /** Message of the coordinate search or of the GPS location. */
  readonly searchMessage = signal<string | null>(null);

  /** Plot shown in the success dialog. */
  readonly savedPlot = signal<FieldPlot | null>(null);

  /** Plots used of the plan, for the success dialog. */
  readonly plotCount = this.fieldManagementStore.plotCount;
  readonly plotQuota = this.fieldManagementStore.plotQuota;

  protected readonly minimumVertices = FieldPlot.MINIMUM_VERTICES;

  /**
   * Creates an instance of PlotBoundaryMapView and reads the plot from the route.
   */
  constructor() {
    this.route.params.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.plotId = +params['id'];
    });

    // Load the saved polygon once the plot is available.
    effect(() => {
      const plot = this.plot();
      if (plot && this.loadedPlotId !== plot.id) {
        this.loadedPlotId = plot.id as number;
        this.markedCoordinates.set(plot.boundary);
        this.fitToPolygon();
      }
    });

    // Redraw the polygon every time a vertex changes.
    effect(() => this.drawPolygon(this.markedCoordinates(), this.polygonStatus()));

    // Change the base layer.
    effect(() => this.showLayer(this.layer()));
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement().nativeElement, { center: DEFAULT_CENTER, zoom: 17 });
    this.drawingLayer.addTo(this.map);
    this.showLayer(this.layer());
    this.map.on('click', (event: L.LeafletMouseEvent) =>
      this.onAddVertex(new GeoCoordinate(event.latlng.lat, event.latlng.lng)),
    );
    this.drawPolygon(this.markedCoordinates(), this.polygonStatus());
    this.fitToPolygon();
    // The map is created before the layout settles; measure it again.
    setTimeout(() => this.map?.invalidateSize());
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  /**
   * Adds a corner of the plot at the end of the polygon.
   * @param coordinate - GPS vertex.
   */
  onAddVertex(coordinate: GeoCoordinate) {
    this.markedCoordinates.update((coordinates) => [...coordinates, coordinate]);
  }

  /** Removes the last vertex. */
  onUndo() {
    this.markedCoordinates.update((coordinates) => coordinates.slice(0, -1));
  }

  /** Removes every vertex. */
  onClear() {
    this.markedCoordinates.set([]);
  }

  /**
   * Centers the map on GPS coordinates typed as `latitude, longitude`.
   * @param text - Text typed by the producer.
   */
  onSearch(text: string) {
    const parts = text.split(',').map((part) => Number(part.trim()));
    const [latitude, longitude] = parts;
    const valid =
      parts.length === 2 &&
      parts.every((part) => Number.isFinite(part)) &&
      Math.abs(latitude) <= 90 &&
      Math.abs(longitude) <= 180;
    if (!valid) {
      this.searchMessage.set('field-management.boundary.search-invalid');
      return;
    }
    this.searchMessage.set(null);
    this.map?.setView([latitude, longitude], 17);
  }

  /** Adds the current GPS location of the phone as a vertex. */
  onUseMyLocation() {
    this.searchMessage.set(null);
    if (!navigator.geolocation) {
      this.searchMessage.set('field-management.boundary.location-unavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.onAddVertex(new GeoCoordinate(coords.latitude, coords.longitude));
        this.map?.setView([coords.latitude, coords.longitude], 18);
      },
      () => this.searchMessage.set('field-management.boundary.location-denied'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  /**
   * Saves the polygon, activates the monitoring and shows the summary.
   */
  onSavePlot() {
    if (this.polygonStatus() !== 'CLOSED') return;
    this.fieldManagementStore.delineateBoundary(
      new DelineatePlotBoundaryCommand({
        plotId: this.plotId,
        coordinates: this.markedCoordinates(),
      }),
      (plot) => {
        this.savedPlot.set(plot);
        this.dialog.open(this.savedDialog(), {
          disableClose: true,
          autoFocus: false,
          maxWidth: '560px',
          width: 'calc(100vw - 32px)',
          panelClass: 'saved-plot-dialog',
        });
      },
    );
  }

  /** Closes the summary and opens the satellite monitoring of Crop Health. */
  onViewCropHealth() {
    this.dialog.closeAll();
    this.router.navigate(['crop-health/monitoring']).then();
  }

  /** Closes the summary and goes back to the plot list. */
  onManagePlots() {
    this.dialog.closeAll();
    this.router.navigate(['field-management/plots']).then();
  }

  /** Shows one base layer and hides the other. */
  private showLayer(layer: MapLayer) {
    if (!this.map) return;
    Object.entries(this.baseLayers).forEach(([name, baseLayer]) => {
      if (name === layer) {
        baseLayer.addTo(this.map!);
      } else {
        baseLayer.remove();
      }
    });
  }

  /** Centers the map on the polygon, if it has one. */
  private fitToPolygon() {
    const coordinates = this.markedCoordinates();
    if (!this.map || coordinates.length === 0) return;
    const bounds = L.latLngBounds(coordinates.map((v) => [v.latitude, v.longitude]));
    this.map.fitBounds(bounds, { padding: [48, 48], maxZoom: 18 });
  }

  /** Draws the vertices with their labels and the polygon. */
  private drawPolygon(coordinates: GeoCoordinate[], status: PolygonStatus) {
    this.drawingLayer.clearLayers();
    const points: L.LatLngExpression[] = coordinates.map((v) => [v.latitude, v.longitude]);
    const color = status === 'CROSSED' ? '#e53935' : '#4caf50';
    if (points.length >= 2) {
      const shape =
        points.length >= FieldPlot.MINIMUM_VERTICES
          ? L.polygon(points, { color, weight: 3, fillOpacity: 0.3 })
          : L.polyline(points, { color, weight: 3 });
      shape.addTo(this.drawingLayer);
    }
    points.forEach((point, index) =>
      L.circleMarker(point, {
        radius: 7,
        color: '#1b5e20',
        weight: 2,
        fillColor: '#ffffff',
        fillOpacity: 1,
      })
        .bindTooltip(`V${index + 1}`, {
          permanent: true,
          direction: 'top',
          offset: [0, -8],
          className: 'vertex-label',
        })
        .addTo(this.drawingLayer),
    );
  }
}
