import { Routes } from '@angular/router';

const cropHealthView = () =>
  import('./presentation/views/crop-health-view/crop-health-view').then((m) => m.CropHealthView);

const agriculturalAlertsView = () =>
  import('./presentation/views/agricultural-alerts-view/agricultural-alerts-view').then(
    (m) => m.AgriculturalAlertsView,
  );

const diagnosisInboxView = () =>
  import('./presentation/views/diagnosis-inbox-view/diagnosis-inbox-view').then(
    (m) => m.DiagnosisInboxView,
  );

const fieldInspectionsView = () =>
  import('./presentation/views/field-inspections-view/field-inspections-view').then(
    (m) => m.FieldInspectionsView,
  );

const prescriptionsView = () =>
  import('./presentation/views/prescriptions-view/prescriptions-view').then(
    (m) => m.PrescriptionsView,
  );

const pestReportForm = () =>
  import('./presentation/views/pest-report-form/pest-report-form').then((m) => m.PestReportForm);

const prescriptionForm = () =>
  import('./presentation/views/prescription-form/prescription-form').then(
    (m) => m.PrescriptionForm,
  );

/**
 * Routes of the Crop Health bounded context (lazy loaded under `/crop-health`).
 */
export const cropHealthRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'monitoring',
        loadComponent: cropHealthView,
        title: 'Crop Health – SumaqAgro | Multispectral Satellite Viewer',
      },
      {
        path: 'alerts',
        loadComponent: agriculturalAlertsView,
        title: 'Agroclimatic Alerts – SumaqAgro',
      },
      {
        path: 'advisor',
        loadComponent: diagnosisInboxView,
        title: 'Crop Health Advisor – SumaqAgro',
      },
      {
        path: 'inbox',
        loadComponent: diagnosisInboxView,
        title: 'Diagnosis Inbox – SumaqAgro',
      },
      {
        path: 'inspections',
        loadComponent: fieldInspectionsView,
        title: 'Field Inspections – SumaqAgro',
      },
      {
        path: 'prescriptions',
        loadComponent: prescriptionsView,
        title: 'Prescriptions History – SumaqAgro',
      },
      {
        path: 'report-pest',
        loadComponent: pestReportForm,
        title: 'Report Pest or Disease – SumaqAgro',
      },
      {
        path: 'prescribe',
        loadComponent: prescriptionForm,
        title: 'Issue Technical Prescription – SumaqAgro',
      },
      { path: '', redirectTo: 'monitoring', pathMatch: 'full' },
    ],
  },
];
