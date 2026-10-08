import { Routes } from '@angular/router';

const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound);

const fieldManagementRoutes = () =>
  import('./field-management/field-management.routes').then((m) => m.fieldManagementRoutes);

const profilesRoutes = () => import('./profiles/profiles.routes').then((m) => m.profilesRoutes);

const demoAccessView = () =>
  import('./shared/presentation/views/demo-access-view/demo-access-view').then(
    (module) => module.DemoAccessView,
  );

const baseTitle = 'SumaqAgro';

/**
 * Root routes. Each bounded context adds its own `*.routes.ts` with lazy loading.
 *
 * @remarks
 * The app starts on the plot dashboard of Field Management, not on a login page.
 */
export const routes: Routes = [
  {
    path: 'demo-access',
    loadComponent: demoAccessView,
    title: `${baseTitle} - Acceso demo`,
  },
  { path: '', redirectTo: '/demo-access', pathMatch: 'full' },
  { path: 'field-management', loadChildren: fieldManagementRoutes },
  { path: 'profiles', loadChildren: profilesRoutes },
  { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Page Not Found` },
];
