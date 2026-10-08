import { RecordPestReportCommand } from '../domain/model/commands/record-pest-report.command';
import { ScheduleFieldInspectionCommand } from '../domain/model/commands/schedule-field-inspection.command';
import { IssueTechnicalPrescriptionCommand } from '../domain/model/commands/issue-technical-prescription.command';
﻿import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';

import { AgroclimaticAlert } from '../domain/model/entities/agroclimatic-alert.entity';
import { ClimateForecast } from '../domain/model/entities/climate-forecast.entity';
import { PestReport } from '../domain/model/entities/pest-report.entity';
import { FieldInspection } from '../domain/model/entities/field-inspection.entity';
import { SatelliteObservation } from '../domain/model/entities/satellite-observation.entity';
import { TechnicalPrescription } from '../domain/model/entities/technical-prescription.entity';

import { AgroclimaticAlertsApiEndpoint } from './endpoints/agroclimatic-alert.endpoint';
import { ClimateForecastsApiEndpoint } from './endpoints/climate-forecast.endpoint';
import { PestReportsApiEndpoint } from './endpoints/pest-report.endpoint';
import { FieldInspectionsApiEndpoint } from './endpoints/field-inspection.endpoint';
import { SatelliteObservationsApiEndpoint } from './endpoints/satellite-observation.endpoint';
import { TechnicalPrescriptionsApiEndpoint } from './endpoints/technical-prescription.endpoint';

/**
 * Facade of the Crop Health infrastructure.
 *
 * @remarks
 * It groups all endpoints related to crop health monitoring so the application
 * layer only depends on this single class.
 */
@Service()
export class CropHealthApi extends BaseApi {
  private readonly alertsEndpoint: AgroclimaticAlertsApiEndpoint;
  private readonly forecastsEndpoint: ClimateForecastsApiEndpoint;
  private readonly reportsEndpoint: PestReportsApiEndpoint;
  private readonly inspectionsEndpoint: FieldInspectionsApiEndpoint;
  private readonly observationsEndpoint: SatelliteObservationsApiEndpoint;
  private readonly prescriptionsEndpoint: TechnicalPrescriptionsApiEndpoint;

  constructor() {
    super();
    const http = inject(HttpClient);
    this.alertsEndpoint = new AgroclimaticAlertsApiEndpoint(http);
    this.forecastsEndpoint = new ClimateForecastsApiEndpoint(http);
    this.reportsEndpoint = new PestReportsApiEndpoint(http);
    this.inspectionsEndpoint = new FieldInspectionsApiEndpoint(http);
    this.observationsEndpoint = new SatelliteObservationsApiEndpoint(http);
    this.prescriptionsEndpoint = new TechnicalPrescriptionsApiEndpoint(http);
  }

  // ---------- Wrapper Methods ----------

  /** Loads satellite observations for a specific plot. */
  getObservationsByPlot(plotId: number): Observable<SatelliteObservation[]> {
    return this.observationsEndpoint.getByPlot(plotId);
  }

  /** Loads pest reports for a specific plot. */
  getPestReportsByPlot(plotId: number): Observable<PestReport[]> {
    return this.reportsEndpoint.getByPlot(plotId);
  }

  /** Loads agroclimatic alerts for a specific region. */
  getAlertsByRegion(region: string): Observable<AgroclimaticAlert[]> {
    return this.alertsEndpoint.getByRegion(region);
  }

  /** Loads climate forecasts for a specific region. */
  getForecastsByRegion(region: string): Observable<ClimateForecast[]> {
    return this.forecastsEndpoint.getByRegion(region);
  }

  /** Loads field inspections associated with a specific pest report. */
  getInspectionsByReportId(reportId: number): Observable<FieldInspection[]> {
    return this.inspectionsEndpoint.getByReportId(reportId);
  }

  /** Loads technical prescriptions associated with a specific pest report. */
  getPrescriptionsByReportId(reportId: number): Observable<TechnicalPrescription[]> {
    return this.prescriptionsEndpoint.getByReportId(reportId);
  }

  getReports(): Observable<PestReport[]> { return this.reportsEndpoint.getAll(); }
  getInspections(): Observable<FieldInspection[]> { return this.inspectionsEndpoint.getAll(); }
  getPrescriptions(): Observable<TechnicalPrescription[]> { return this.prescriptionsEndpoint.getAll(); }

  recordReport(command: RecordPestReportCommand): Observable<PestReport> {
    return this.reportsEndpoint.create(new PestReport({ ...command }));
  }

  scheduleInspection(command: ScheduleFieldInspectionCommand): Observable<FieldInspection> {
    return this.inspectionsEndpoint.create(new FieldInspection({ ...command }));
  }

  issuePrescription(command: IssueTechnicalPrescriptionCommand): Observable<TechnicalPrescription> {
    return this.prescriptionsEndpoint.create(new TechnicalPrescription({ ...command }));
  }
}
