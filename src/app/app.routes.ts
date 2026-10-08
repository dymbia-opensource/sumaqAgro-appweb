import { Routes } from '@angular/router';

const layout = () =>
  import('./shared/presentation/components/layout/layout').then((m) => m.Layout);

const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound);

const demoAccessView = () =>
  import('./shared/presentation/views/demo-access-view/demo-access-view').then(
    (m) => m.DemoAccessView,
  );

const fieldManagementRoutes = () =>
  import('./field-management/field-management.routes').then((m) => m.fieldManagementRoutes);

const cropHealthRoutes = () =>
  import('./crop-health/crop-health.routes').then((m) => m.cropHealthRoutes);

const profilesRoutes = () => import('./profiles/profiles.routes').then((m) => m.profilesRoutes);

const harvestCertificationRoutes = () =>
  import('./harvest-certification/harvest-certification.routes').then(
    (m) => m.harvestCertificationRoutes,
  );

const publicTraceabilityView = () =>
  import(
    './harvest-certification/presentation/views/public-traceability-view/public-traceability-view'
  ).then((m) => m.PublicTraceabilityView);

const baseTitle = 'SumaqAgro';

/**
 * Root routes. Each bounded context adds its own `*.routes.ts` with lazy loading.
 *
 * @remarks
 * The private pages are children of the shell (`Layout`: side menu and top
 * bar). The demo access and the public QR verification are shown without it.
 * When IAM is implemented, the shell route gets `canActivate: [iamGuard]`
 * and the demo access is replaced by the IAM routes.
 */
export const routes: Routes = [
  // Pages without the shell
  { path: 'demo-access', loadComponent: demoAccessView, title: `${baseTitle} - Acceso demo` },
  {
    path: 'verify/:token',
    loadComponent: publicTraceabilityView,
    title: `Verificar certificado | ${baseTitle}`,
  },
  { path: '', redirectTo: '/demo-access', pathMatch: 'full' },

  // Pages inside the shell
  {
    path: '',
    loadComponent: layout,
    children: [
      { path: 'field-management', loadChildren: fieldManagementRoutes },
      { path: 'crop-health', loadChildren: cropHealthRoutes },
      { path: 'profiles', loadChildren: profilesRoutes },
      { path: 'harvest-certification', loadChildren: harvestCertificationRoutes },
      { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Page Not Found` },
    ],
  },
];
