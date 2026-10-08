import { Routes } from '@angular/router';

const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound);

const fieldManagementRoutes = () =>
  import('./field-management/field-management.routes').then((m) => m.fieldManagementRoutes);

const baseTitle = 'SumaqAgro';

/**
 * Root route configuration that composes the bounded-context routes.
 */
/*
// IAM-enabled Routes version to replace when IAM is implemented
import { iamGuard } from './iam/infrastructure/iam.guard';
const iamRoutes = () => import('./iam/iam.routes').then((m) => m.iamRoutes);

export const routes: Routes = [
  { path: 'field-management', loadChildren: fieldManagementRoutes, canActivate: [iamGuard] },
  { path: 'iam', loadChildren: iamRoutes },
  { path: '', redirectTo: '/field-management/dashboard', pathMatch: 'full' },
  { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Page Not Found` },
];
*/

// Public Routes version to use until IAM is implemented
export const routes: Routes = [
  { path: 'field-management', loadChildren: fieldManagementRoutes },
  { path: '', redirectTo: '/field-management/dashboard', pathMatch: 'full' },
  { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Page Not Found` },
];
