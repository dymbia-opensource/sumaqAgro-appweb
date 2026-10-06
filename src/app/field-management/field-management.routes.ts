import { Routes } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

const myPlotDashboardView = () =>
  import('./presentation/views/my-plot-dashboard-view/my-plot-dashboard-view').then(
    (m) => m.MyPlotDashboardView,
  );

/**
 * Routes of the Field Management bounded context (lazy loaded under `/field-management`).
 *
 * @remarks
 * Chart.js is provided here, so it is only downloaded when the user opens
 * this context. The IAM guard is added in the IAM phase.
 */
export const fieldManagementRoutes: Routes = [
  {
    path: '',
    providers: [provideCharts(withDefaultRegisterables())],
    children: [
      {
        path: 'dashboard',
        loadComponent: myPlotDashboardView,
        title: 'My Plot – SumaqAgro | Crop Monitoring and Management Dashboard',
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
