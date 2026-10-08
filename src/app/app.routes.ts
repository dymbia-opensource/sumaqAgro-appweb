import { Routes } from '@angular/router';

const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound);

const fieldManagementRoutes = () =>
  import('./field-management/field-management.routes').then((m) => m.fieldManagementRoutes);

const harvestCertificationRoutes = () =>
  import('./harvest-certification/harvest-certification.routes').then((m) => m.harvestCertificationRoutes);

const publicTraceabilityView = () =>
  import('./harvest-certification/presentation/views/public-traceability-view/public-traceability-view').then(
    (m) => m.PublicTraceabilityView,
  );

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
  { path: 'harvest-certification', loadChildren: harvestCertificationRoutes, canActivate: [iamGuard] },
  { path: 'verify/:token', loadComponent: publicTraceabilityView, title: 'Verificar certificado | SumaqAgro' },
  { path: 'iam', loadChildren: iamRoutes },
  { path: '', redirectTo: '/field-management/dashboard', pathMatch: 'full' },
  { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Page Not Found` },
];
*/

// Public Routes version to use until IAM is implemented
export const routes: Routes = [
  { path: 'field-management', loadChildren: fieldManagementRoutes },
  { path: 'harvest-certification', loadChildren: harvestCertificationRoutes },
  { path: 'verify/:token', loadComponent: publicTraceabilityView, title: 'Verificar certificado | SumaqAgro' },
  { path: '', redirectTo: '/field-management/dashboard', pathMatch: 'full' },
  { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Page Not Found` },
];
