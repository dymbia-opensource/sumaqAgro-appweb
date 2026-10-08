import { Routes } from '@angular/router';

const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound);

const fieldManagementRoutes = () =>
  import('./field-management/field-management.routes').then((m) => m.fieldManagementRoutes);

const baseTitle = 'SumaqAgro';

/**
 * Root routes. Each bounded context adds its own `*.routes.ts` with lazy loading.
 *
 * @remarks
 * The app starts on the plot dashboard of Field Management, not on a login page.
 */
export const routes: Routes = [
  { path: '', redirectTo: '/field-management/dashboard', pathMatch: 'full' },
  { path: 'field-management', loadChildren: fieldManagementRoutes },
  { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Page Not Found` },
];
