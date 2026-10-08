import { Routes } from '@angular/router';

const farmerSettingsView = () =>
  import('./presentation/views/farmer-settings-view/farmer-settings-view').then(
    (module) => module.FarmerSettingsView,
  );

/** Routes of the Profiles bounded context, lazy loaded under `/profiles`. */
export const profilesRoutes: Routes = [
  { path: 'settings', loadComponent: farmerSettingsView, title: 'Configuración y ayuda | SumaqAgro' },
  { path: '', redirectTo: 'settings', pathMatch: 'full' },
];
