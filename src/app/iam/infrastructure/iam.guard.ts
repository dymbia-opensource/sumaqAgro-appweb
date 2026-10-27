import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../application/iam.store';

/**
 * Requires an authenticated session before activating a route.
 */
export const iamGuard: CanActivateFn = (_route, state) => {
  const store = inject(IamStore);
  const router = inject(Router);
  store.checkSessionExpiration();

  if (store.isSignedIn()) {
    return true;
  }

  return router.createUrlTree(['/iam/sign-in'], {
    queryParams: {
      returnUrl: state.url,
    },
  });
};
