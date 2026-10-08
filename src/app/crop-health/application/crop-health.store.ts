import { computed, inject, Service, signal } from '@angular/core';
import { retry } from 'rxjs';
import { CropHealthApi } from '../infrastructure/crop-health-api';

import { AgroclimaticAlert } from '../domain/model/entities/agroclimatic-alert.entity';
import { ClimateForecast } from '../domain/model/entities/climate-forecast.entity';
import { PestReport } from '../domain/model/entities/pest-report.entity';
import { FieldInspection } from '../domain/model/entities/field-inspection.entity';
import { SatelliteObservation } from '../domain/model/entities/satellite-observation.entity';
import { TechnicalPrescription } from '../domain/model/entities/technical-prescription.entity';

/**
 * Application store for Crop Health.
 *
 * @remarks
 * Acts as the single source of truth for the presentation layer, holding
 * all the reactive state (Signals) for the 6 crop health entities.
 */
@Service()
export class CropHealthStore {
  private readonly cropHealthApi = inject(CropHealthApi);

  // --- Private Reactive State (Signals) ---
  private readonly observationsSignal = signal<SatelliteObservation[]>([]);
  private readonly pestReportsSignal = signal<PestReport[]>([]);
  private readonly alertsSignal = signal<AgroclimaticAlert[]>([]);
  private readonly forecastsSignal = signal<ClimateForecast[]>([]);
  private readonly inspectionsSignal = signal<FieldInspection[]>([]);
  private readonly prescriptionsSignal = signal<TechnicalPrescription[]>([]);

  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // --- Public Readonly State (For the Views) ---
  readonly observations = this.observationsSignal.asReadonly();
  readonly pestReports = this.pestReportsSignal.asReadonly();
  readonly alerts = this.alertsSignal.asReadonly();
  readonly forecasts = this.forecastsSignal.asReadonly();
  readonly inspections = this.inspectionsSignal.asReadonly();
  readonly prescriptions = this.prescriptionsSignal.asReadonly();

  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // --- Computed Properties ---
  /** Counts how many pest reports are still pending inspection or treatment. */
  readonly pendingPestReportsCount = computed(() =>
    this.pestReports().filter(report => report.status === 'PENDING').length
  );

  // --- State Modification Methods ---

  loadObservations(plotId: number): void {
    this.startLoading();
    this.observationsSignal.set([]);
    this.cropHealthApi.getObservationsByPlot(plotId).pipe(retry(2)).subscribe({
      next: (data) => { this.observationsSignal.set(data); this.stopLoading(); },
      error: (err: Error) => this.fail(err, 'crop-health.errors.load-observations'),
    });
  }
  loadPestReports(plotId: number): void {
    this.startLoading();
    this.cropHealthApi.getPestReportsByPlot(plotId).pipe(retry(2)).subscribe({
      next: (data) => { this.pestReportsSignal.set(data); this.stopLoading(); },
      error: (err: Error) => this.fail(err),
    });
  }

  loadAlerts(region: string): void {
    this.startLoading();
    this.alertsSignal.set([]);
    this.cropHealthApi.getAlertsByRegion(region).pipe(retry(2)).subscribe({
      next: (data) => { this.alertsSignal.set(data); this.stopLoading(); },
      error: (err: Error) => this.fail(err, 'crop-health.errors.load-alerts'),
    });
  }
  loadForecasts(region: string): void {
    this.startLoading();
    this.cropHealthApi.getForecastsByRegion(region).pipe(retry(2)).subscribe({
      next: (data) => { this.forecastsSignal.set(data); this.stopLoading(); },
      error: (err: Error) => this.fail(err),
    });
  }

  loadInspections(reportId: number): void {
    this.startLoading();
    this.cropHealthApi.getInspectionsByReportId(reportId).pipe(retry(2)).subscribe({
      next: (data) => { this.inspectionsSignal.set(data); this.stopLoading(); },
      error: (err: Error) => this.fail(err),
    });
  }

  loadPrescriptions(reportId: number): void {
    this.startLoading();
    this.cropHealthApi.getPrescriptionsByReportId(reportId).pipe(retry(2)).subscribe({
      next: (data) => { this.prescriptionsSignal.set(data); this.stopLoading(); },
      error: (err: Error) => this.fail(err),
    });
  }

  // --- Helper Methods ---

  private startLoading(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
  }

  private stopLoading(): void {
    this.loadingSignal.set(false);
  }

  private fail(error: Error, messageKey?: string): void {
    this.errorSignal.set(messageKey ?? error.message);
    this.loadingSignal.set(false);
  }
}
