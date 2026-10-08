
import { Routes } from '@angular/router';

const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found')
    .then((m) => m.PageNotFound);

const fieldManagementRoutes = () =>
  import('./field-management/field-management.routes')
    .then((m) => m.fieldManagementRoutes);

const profilesRoutes = () =>
  import('./profiles/profiles.routes')
    .then((m) => m.profilesRoutes);

const demoAccessView = () =>
  import('./shared/presentation/views/demo-access-view/demo-access-view')
    .then((m) => m.DemoAccessView);

const harvestCertificationRoutes = () =>
  import('./harvest-certification/harvest-certification.routes')
    .then((m) => m.harvestCertificationRoutes);

const publicTraceabilityView = () =>
  import('./harvest-certification/presentation/views/public-traceability-view/public-traceability-view')
    .then((m) => m.PublicTraceabilityView);

const baseTitle = 'SumaqAgro';

/**
 * Root routes.
 * Public routes until IAM is implemented.
 */
export const routes: Routes = [
  {
    path: 'demo-access',
    loadComponent: demoAccessView,
    title: `${baseTitle} - Acceso demo`,
  },
  {
    path: 'field-management',
    loadChildren: fieldManagementRoutes,
  },
  {
    path: 'profiles',
    loadChildren: profilesRoutes,
  },
  {
    path: 'harvest-certification',
    loadChildren: harvestCertificationRoutes,
  },
  {
    path: 'verify/:token',
    loadComponent: publicTraceabilityView,
    title: 'Verificar certificado | SumaqAgro',
  },
  {
    path: '',
    redirectTo: '/demo-access',
    pathMatch: 'full',
  },
  {
    path: '**',
    loadComponent: pageNotFound,
    title: `${baseTitle} - Page Not Found`,
  },
];
