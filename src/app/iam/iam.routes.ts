import { Routes } from '@angular/router';

export const iamRoutes: Routes = [
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./presentation/views/sign-in-form/sign-in-form').then((m) => m.SignInForm),
    title: 'Iniciar sesión | SumaqAgro',
  },
  {
    path: '',
    redirectTo: 'sign-in',
    pathMatch: 'full',
  },
];
