import { Routes } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

const myPlotDashboardView = () =>
  import('./presentation/views/my-plot-dashboard-view/my-plot-dashboard-view').then(
    (m) => m.MyPlotDashboardView,
  );
const registeredPlotsView = () =>
  import('./presentation/views/registered-plots-view/registered-plots-view').then(
    (m) => m.RegisteredPlotsView,
  );
const plotRegistrationView = () =>
  import('./presentation/views/plot-registration-view/plot-registration-view').then(
    (m) => m.PlotRegistrationView,
  );
const plotBoundaryMapView = () =>
  import('./presentation/views/plot-boundary-map-view/plot-boundary-map-view').then(
    (m) => m.PlotBoundaryMapView,
  );

const baseTitle = 'SumaqAgro';

/**
 * Route tree for the Field Management views (lazy loaded under `/field-management`).
 *
 * @remarks
 * Chart.js is provided here, so it is only downloaded when the user opens
 * this context.
 */
export const fieldManagementRoutes: Routes = [
  {
    path: '',
    providers: [provideCharts(withDefaultRegisterables())],
    children: [
      {
        path: 'dashboard',
        loadComponent: myPlotDashboardView,
        title: `My Plot – ${baseTitle} | Crop Monitoring and Management Dashboard`,
      },
      { path: 'plots', loadComponent: registeredPlotsView, title: `My Plots – ${baseTitle}` },
      {
        path: 'plots/new',
        loadComponent: plotRegistrationView,
        title: `Register a Plot – ${baseTitle}`,
      },
      {
        path: 'plots/:id/boundary',
        loadComponent: plotBoundaryMapView,
        title: `Delineate the Plot – ${baseTitle}`,
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
