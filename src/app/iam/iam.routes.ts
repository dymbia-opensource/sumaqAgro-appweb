import { Routes } from '@angular/router';

export const iamRoutes: Routes = [
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./presentation/views/sign-in-form/sign-in-form').then((m) => m.SignInForm),
    title: 'Iniciar sesión | SumaqAgro',
  },
  {
    path: 'sign-up',
    loadComponent: () =>
      import('./presentation/views/sign-up-form/sign-up-form').then((m) => m.SignUpForm),
    title: 'Crear cuenta | SumaqAgro',
  },
  {
    path: '',
    redirectTo: 'sign-in',
    pathMatch: 'full',
  },
];
