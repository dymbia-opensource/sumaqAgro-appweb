import { computed, DestroyRef, effect, inject, Service, signal, untracked } from '@angular/core';
import { Observable, Subscription, forkJoin, map, of, retry, switchMap, tap, throwError } from 'rxjs';
import { DemoSessionService } from '../../shared/application/demo-session.service';
import { PlotSelectionService } from '../../shared/application/plot-selection.service';
import { DemoUser } from '../../shared/domain/model/demo-user';
import { FieldManagementApi } from '../../field-management/infrastructure/field-management-api';
import { FieldManagementStore } from '../../field-management/application/field-management.store';
import { FieldPlot } from '../../field-management/domain/model/entities/field-plot.entity';
import { HarvestCertificationApi } from '../../harvest-certification/infrastructure/harvest-certification-api';
import { ProfilesApi } from '../../profiles/infrastructure/profiles-api';
import { TechnicalAdvisor } from '../../profiles/domain/model/entities/technical-advisor.entity';
import { CropHealthApi } from '../infrastructure/crop-health-api';
import { RecordPestReportCommand } from '../domain/model/commands/record-pest-report.command';
import { ScheduleFieldInspectionCommand } from '../domain/model/commands/schedule-field-inspection.command';
import { IssueTechnicalPrescriptionCommand } from '../domain/model/commands/issue-technical-prescription.command';
import { AgroclimaticAlert } from '../domain/model/entities/agroclimatic-alert.entity';
import { ClimateForecast } from '../domain/model/entities/climate-forecast.entity';
import { PestReport } from '../domain/model/entities/pest-report.entity';
import { FieldInspection } from '../domain/model/entities/field-inspection.entity';
import { SatelliteObservation } from '../domain/model/entities/satellite-observation.entity';
import { TechnicalPrescription } from '../domain/model/entities/technical-prescription.entity';
import { requireDate, todayInLima } from '../domain/model/validation';

/** Coordinates scoped data and demo permissions. Production authorization belongs to the API. */
@Service()
export class CropHealthStore {
  private readonly api = inject(CropHealthApi);
  private readonly profiles = inject(ProfilesApi);
  private readonly fields = inject(FieldManagementApi);
  private readonly fieldStore = inject(FieldManagementStore);
  private readonly harvest = inject(HarvestCertificationApi);
  private readonly session = inject(DemoSessionService);
  private readonly selection = inject(PlotSelectionService);
  private readonly requests = new Map<string, Subscription>();
  private readonly busy = signal<Record<string, boolean>>({});
  private readonly errors = signal<Record<string, string | null>>({});
  private readonly plotsSignal = signal<FieldPlot[]>([]);
  private readonly advisorSignal = signal<TechnicalAdvisor | null>(null);
  private readonly advisorsSignal = signal<TechnicalAdvisor[]>([]);
  private readonly scopeUser = signal<number | null>(null);
  private readonly ready = signal(false);
  private epoch = 0;
  private readonly observationsSignal = signal<SatelliteObservation[]>([]);
  private readonly reportsSignal = signal<PestReport[]>([]);
  private readonly alertsSignal = signal<AgroclimaticAlert[]>([]);
  private readonly forecastsSignal = signal<ClimateForecast[]>([]);
  private readonly inspectionsSignal = signal<FieldInspection[]>([]);
  private readonly prescriptionsSignal = signal<TechnicalPrescription[]>([]);

  readonly activeUser = this.session.activeUser;
  readonly scopeReady = computed(() => this.ready() && this.scopeUser() === this.activeUser()?.id && (!this.canReport() || !this.fieldStore.plotsLoading()));
  readonly plots = computed(() => !this.scopeReady() ? [] : this.canReport() ? this.fieldStore.plots().filter(plot => plot.ownerUserId === this.activeUser()?.id) : this.plotsSignal());
  readonly selectedPlot = computed(() => this.plots().find(plot => plot.id === this.selection.selectedPlotId()));
  readonly observations = computed(() => this.scopeReady() ? this.observationsSignal().filter(item => item.plotId === this.selectedPlot()?.id) : []);
  readonly latestObservation = computed(() => this.observations()[0] ?? null);
  readonly pestReports = computed(() => this.scopeReady() ? this.reportsSignal().filter(report => this.plots().some(plot => plot.id === report.plotId)) : []);
  readonly alerts = computed(() => this.scopeReady() ? this.alertsSignal().filter(item => item.region === this.selectedPlot()?.region) : []);
  readonly forecasts = computed(() => this.scopeReady() ? this.forecastsSignal() : []);
  readonly inspections = computed(() => this.scopeReady() ? this.inspectionsSignal().filter(inspection => this.pestReports().some(report => report.id === inspection.reportId)) : []);
  readonly prescriptions = computed(() => this.scopeReady() ? this.prescriptionsSignal().filter(prescription => this.pestReports().some(report => report.id === prescription.reportId)) : []);
  readonly advisors = computed(() => this.scopeReady() ? this.advisorsSignal() : []);
  readonly currentAdvisor = computed(() => this.scopeReady() ? this.advisorSignal() : null);
  readonly canReport = computed(() => this.activeUser()?.experience === 'FARMER');
  readonly canSchedule = computed(() => ['AGRONOMIST', 'COOPERATIVE_DIRECTOR'].includes(this.activeUser()?.experience ?? ''));
  readonly canPrescribe = computed(() => this.activeUser()?.experience === 'AGRONOMIST' && this.currentAdvisor()?.userId === this.activeUser()?.id);
  readonly saving = computed(() => !!this.busy()['write']);
  readonly loading = computed(() => Object.entries(this.busy()).some(([key, value]) => key !== 'write' && value));
  readonly scopeLoading = computed(() => !!this.busy()['scope'] || (this.canReport() && this.fieldStore.plotsLoading()));
  readonly clinicalLoading = computed(() => !!this.busy()['clinical'] || this.scopeLoading());
  readonly observationsLoading = computed(() => !!this.busy()['observations'] || this.scopeLoading());
  readonly alertsLoading = computed(() => !!this.busy()['alerts'] || this.scopeLoading());
  readonly scopeError = computed(() => this.errors()['scope'] ?? (this.canReport() && this.fieldStore.error() === 'field-management.errors.load-plots' ? 'crop-health.errors.load-plots' : null));
  readonly clinicalError = computed(() => this.scopeError() ?? this.errors()['clinical'] ?? null);
  readonly observationsError = computed(() => this.scopeError() ?? this.errors()['observations'] ?? null);
  readonly alertsError = computed(() => this.scopeError() ?? this.errors()['alerts'] ?? null);
  readonly writeError = computed(() => this.errors()['write'] ?? null);
  readonly error = computed(() => Object.values(this.errors()).find(value => value) ?? null);
  readonly pendingPestReportsCount = computed(() => this.pestReports().filter(report => report.status === 'PENDING').length);
  readonly treatableReports = computed(() => this.pestReports().filter(report => report.status === 'INSPECTED'));
  readonly schedulableReports = computed(() => this.pestReports().filter(report => report.status === 'PENDING' && !this.inspections().some(inspection => inspection.reportId === report.id)));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.reset());
    effect(() => {
      const user = this.activeUser();
      untracked(() => this.loadScope(user));
    });
  }

  private loadScope(user: DemoUser | null): void {
    this.reset();
    if (!user) return;
    this.scopeUser.set(user.id);
    const result = user.experience === 'FARMER'
      ? this.fields.getPlotsByOwner(user.id).pipe(map(plots => ({ plots, advisors: [] as TechnicalAdvisor[], advisor: null as TechnicalAdvisor | null })))
      : (user.experience === 'AGRONOMIST'
          ? this.profiles.getAdvisorByUser(user.id).pipe(switchMap(advisor => advisor
              ? this.cooperativeScope(advisor.cooperativeId, advisor)
              : throwError(() => new Error('crop-health.errors.advisor-not-assigned'))))
          : this.profiles.getCooperativeByDirector(user.id).pipe(switchMap(cooperative => cooperative
              ? this.cooperativeScope(cooperative.id as number, null)
              : throwError(() => new Error('crop-health.errors.no-cooperative')))));
    this.read('scope', result.pipe(retry(2)), data => {
      this.plotsSignal.set(data.plots);
      this.advisorsSignal.set(data.advisors);
      this.advisorSignal.set(data.advisor);
      this.ready.set(true);
      const selected = data.plots.find(plot => plot.id === this.selection.selectedPlotId()) ?? data.plots[0];
      this.selection.select(selected ? selected.id as number : null);
    }, 'crop-health.errors.load-plots');
  }

  private cooperativeScope(cooperativeId: number, advisor: TechnicalAdvisor | null) {
    return forkJoin({ members: this.harvest.getMembers(cooperativeId), advisors: this.profiles.getTechnicalAdvisors(cooperativeId) }).pipe(
      switchMap(({ members, advisors }) => {
        const ids = [...new Set(members.filter(member => (member as typeof member & { active?: boolean }).active !== false).flatMap(member => member.plots.map(plot => plot.id)))];
        const plots = ids.length ? this.fields.getPlotsByIds(ids) : of([] as FieldPlot[]);
        return plots.pipe(map(plots => ({ plots, advisors, advisor })));
      }),
    );
  }

  selectPlot(plotId: number): void {
    if (!this.plots().some(plot => plot.id === plotId)) return;
    this.requests.get('observations')?.unsubscribe(); this.requests.get('alerts')?.unsubscribe();
    this.setBusy('observations', false); this.setBusy('alerts', false);
    this.observationsSignal.set([]); this.alertsSignal.set([]);
    this.setError('observations', null); this.setError('alerts', null);
    this.selection.select(plotId);
    if (this.canReport()) this.fieldStore.selectPlot(plotId);
  }

  loadObservations(plotId: number): void {
    this.observationsSignal.set([]);
    if (!this.plots().some(plot => plot.id === plotId && plot.hasPolygon())) return;
    this.read('observations', this.api.getObservationsByPlot(plotId).pipe(retry(2)), data => {
      const plot = this.plots().find(plot => plot.id === plotId);
      if (!plot) return;
      if (data.some(observation => observation.plotId !== plotId || observation.stressAreaHectares > plot.areaHectares)) {
        throw new Error('crop-health.errors.invalid-data');
      }
      this.observationsSignal.set([...data].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)));
    }, 'crop-health.errors.load-observations');
  }

  loadAlerts(region: string): void {
    this.alertsSignal.set([]);
    if (!this.plots().some(plot => plot.region === region)) return;
    this.read('alerts', this.api.getAlertsByRegion(region).pipe(retry(2)), data => this.alertsSignal.set(data.filter(alert => alert.region === region)), 'crop-health.errors.load-alerts');
  }

  loadClinicalData(onLoaded?: () => void): void {
    if (!this.scopeReady()) return;
    const plots = this.plots();
    const reports = plots.length ? forkJoin(plots.map(plot => this.api.getPestReportsByPlot(plot.id as number))).pipe(map(groups => groups.flat())) : of([] as PestReport[]);
    this.read('clinical', reports.pipe(switchMap(reports => {
      const allowed = reports.filter(report => plots.some(plot => plot.id === report.plotId));
      const ids = new Set(allowed.map(report => report.id));
      if (!ids.size) return of({ reports: allowed, inspections: [] as FieldInspection[], prescriptions: [] as TechnicalPrescription[] });
      return forkJoin({ inspections: this.api.getInspections(), prescriptions: this.api.getPrescriptions() }).pipe(map(data => ({
        reports: allowed, inspections: data.inspections.filter(item => ids.has(item.reportId)),
        prescriptions: data.prescriptions.filter(item => ids.has(item.reportId)),
      })));
    }), retry(2)), data => {
      this.reportsSignal.set(data.reports); this.inspectionsSignal.set(data.inspections);
      this.prescriptionsSignal.set(data.prescriptions); onLoaded?.();
    }, 'crop-health.errors.load-workflow');
  }

  recordReport(command: RecordPestReportCommand, onSaved: () => void, onFailure: () => void): void {
    this.mutate(() => {
      const user = this.activeUser();
      const plot = this.plots().find(plot => plot.id === command.plotId);
      if (!this.canReport() || !user || !plot || plot.ownerUserId !== user.id || command.reporterId !== user.id) this.denied();
      new PestReport({ ...command });
      return this.api.recordReport(new RecordPestReportCommand({ ...command, plotName: plot!.name }));
    }, report => this.reportsSignal.update(items => [...items, report]), onSaved, onFailure, 'crop-health.errors.save-report');
  }

  scheduleInspection(command: ScheduleFieldInspectionCommand, onSaved: () => void, onFailure: () => void): void {
    this.mutate(() => {
      if (!this.canSchedule()) this.denied();
      if (this.report(command.reportId).status !== 'PENDING') throw new Error('crop-health.errors.invalid-transition');
      requireDate(command.scheduledAt);
      if (Date.parse(command.scheduledAt) <= Date.now()) throw new Error('crop-health.errors.future-visit');
      if (this.inspections().some(item => item.reportId === command.reportId)) throw new Error('crop-health.errors.visit-already-scheduled');
      return this.api.scheduleInspection(command);
    }, inspection => this.inspectionsSignal.update(items => [...items, inspection]), onSaved, onFailure, 'crop-health.errors.save-inspection');
  }

  completeInspection(id: number, notes: string, onSaved: () => void, onFailure: () => void): void {
    let inspectionSaved = false;
    this.mutate(() => {
      const user = this.activeUser();
      const current = this.inspections().find(item => item.id === id);
      if (!this.canPrescribe() || !user || !current) this.denied();
      const report = this.copyReport(this.report(current!.reportId));
      if (report.status !== 'PENDING') throw new Error('crop-health.errors.invalid-transition');
      const inspection = new FieldInspection({ id: current!.id, reportId: current!.reportId,
        scheduledAt: current!.scheduledAt, notes: current!.notes, status: current!.status,
        completedAt: current!.completedAt, inspectorUserId: current!.inspectorUserId });
      let saved: Observable<FieldInspection>;
      if (inspection.status === 'COMPLETED') {
        if (inspection.inspectorUserId !== user!.id || report.status !== 'PENDING') this.denied();
        saved = of(inspection);
      } else {
        inspection.complete(notes, user!.id);
        saved = this.api.updateInspection(inspection);
      }
      return saved.pipe(tap(result => {
        inspectionSaved = true;
        this.inspectionsSignal.update(items => items.map(item => item.id === result.id ? result : item));
      }), switchMap(() => {
        if (report.status !== 'PENDING') return of(report);
        report.markInspected(); return this.api.updateReport(report);
      }));
    }, report => this.replaceReport(report), onSaved, onFailure, () => inspectionSaved ? 'crop-health.errors.inspection-status-partial' : 'crop-health.errors.complete-inspection');
  }

  issuePrescription(command: IssueTechnicalPrescriptionCommand, onSaved: () => void, onFailure: () => void): void {
    this.mutate(() => {
      if (!this.canPrescribe() || command.agronomistId !== this.activeUser()?.id) this.denied();
      if (this.report(command.reportId).status !== 'INSPECTED') throw new Error('crop-health.errors.inspection-required');
      requireDate(command.applicationDate);
      if (command.applicationDate < todayInLima()) throw new Error('crop-health.errors.past-application');
      new TechnicalPrescription({ ...command });
      return this.api.issuePrescription(command);
    }, prescription => this.prescriptionsSignal.update(items => [...items, prescription]), onSaved, onFailure, 'crop-health.errors.save-prescription');
  }

  resolveReport(id: number, onSaved: () => void, onFailure: () => void): void {
    this.mutate(() => {
      if (!this.canPrescribe()) this.denied();
      const report = this.copyReport(this.report(id));
      if (!this.prescriptions().some(item => item.reportId === id)) throw new Error('crop-health.errors.prescription-required');
      report.resolve(); return this.api.updateReport(report);
    }, report => this.replaceReport(report), onSaved, onFailure, 'crop-health.errors.resolve-report');
  }

  canDeleteReport(id: number): boolean {
    const report = this.pestReports().find(item => item.id === id);
    return this.canReport() && !this.clinicalLoading() && !this.clinicalError() && !!report &&
      report.reporterId === this.activeUser()?.id && report.status === 'PENDING' &&
      !this.inspections().some(item => item.reportId === id) && !this.prescriptions().some(item => item.reportId === id);
  }

  deleteReport(id: number, onSaved: () => void, onFailure: () => void): void {
    this.mutate(() => {
      if (!this.canDeleteReport(id)) this.denied();
      return this.api.deleteReport(id);
    }, () => this.reportsSignal.update(items => items.filter(item => item.id !== id)), onSaved, onFailure, 'crop-health.errors.delete-report');
  }
  clearError(): void { this.setError('write', null); }
  reportLabel(id: number): string {
    const reports = [...this.pestReports()].sort((a, b) => Number(a.id) - Number(b.id));
    const index = reports.findIndex(item => Number(item.id) === id);
    return index >= 0 ? '#' + (index + 1) + ' · ' + reports[index].plotName : '#' + id;
  }
  advisorName(id: number): string { return this.advisors().find(item => item.userId === id)?.name ?? this.session.users.find(user => user.id === id)?.displayName ?? '#' + id; }
  canResolve(id: number): boolean { return this.canPrescribe() && this.pestReports().some(item => item.id === id && item.status === 'INSPECTED') && this.prescriptions().some(item => item.reportId === id); }
  canComplete(inspection: FieldInspection): boolean { return this.canPrescribe() && this.pestReports().some(report => report.id === inspection.reportId && report.status === 'PENDING') && (inspection.status === 'SCHEDULED' || inspection.inspectorUserId === this.activeUser()?.id); }

  private report(id: number): PestReport { const report = this.pestReports().find(item => item.id === id); if (!report) this.denied(); return report!; }
  private copyReport(report: PestReport): PestReport { return new PestReport({ id: report.id, plotId: report.plotId, plotName: report.plotName, reporterId: report.reporterId, description: report.description, severity: report.severity, status: report.status, photo: report.photo, clientSyncId: report.clientSyncId }); }
  private replaceReport(report: PestReport): void { this.reportsSignal.update(items => items.map(item => item.id === report.id ? report : item)); }
  private denied(): never { throw new Error('crop-health.errors.not-authorized'); }
  private setBusy(key: string, value: boolean): void { this.busy.update(items => ({ ...items, [key]: value })); }
  private setError(key: string, value: string | null): void { this.errors.update(items => ({ ...items, [key]: value })); }
  private message(error: unknown, fallback: string): string { return error instanceof Error && error.message.startsWith('crop-health.errors.') ? error.message : fallback; }

  private read<T>(key: string, source: Observable<T>, onData: (data: T) => void, fallback: string): void {
    this.requests.get(key)?.unsubscribe(); this.setBusy(key, true); this.setError(key, null);
    const epoch = this.epoch;
    const request = source.subscribe({
      next: data => {
        if (epoch !== this.epoch) return;
        this.setBusy(key, false);
        try { onData(data); } catch (error) { this.setError(key, this.message(error, fallback)); }
      },
      error: error => { if (epoch === this.epoch) { this.setBusy(key, false); this.setError(key, this.message(error, fallback)); } },
    });
    this.requests.set(key, request);
  }

  private mutate<T>(source: () => Observable<T>, update: (data: T) => void, onSaved: () => void, onFailure: () => void, fallback: string | (() => string)): void {
    if (this.saving()) { onFailure(); return; }
    this.clearError();
    const epoch = this.epoch;
    try {
      if (!this.scopeReady()) this.denied();
      const operation = source();
      this.setBusy('write', true);
      this.requests.set('write', operation.subscribe({
        next: data => { if (epoch === this.epoch) { update(data); this.setBusy('write', false); onSaved(); } },
        error: error => { if (epoch === this.epoch) { this.setBusy('write', false); this.setError('write', this.message(error, typeof fallback === 'string' ? fallback : fallback())); onFailure(); } },
      }));
    } catch (error) {
      this.setBusy('write', false); this.setError('write', this.message(error, typeof fallback === 'string' ? fallback : fallback())); onFailure();
    }
  }

  private reset(): void {
    this.epoch++;
    this.requests.forEach(request => request.unsubscribe()); this.requests.clear();
    this.busy.set({}); this.errors.set({}); this.ready.set(false); this.scopeUser.set(null);
    this.plotsSignal.set([]); this.advisorsSignal.set([]); this.advisorSignal.set(null);
    this.observationsSignal.set([]); this.reportsSignal.set([]); this.alertsSignal.set([]);
    this.forecastsSignal.set([]); this.inspectionsSignal.set([]); this.prescriptionsSignal.set([]);
  }
}
