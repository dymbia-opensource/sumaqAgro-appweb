import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { UserRole } from '../domain/model/value-objects/user-role';
import { IamStore } from '../application/iam.store';

/** Checks route permissions against the session's active role; the API enforces authorization. */
export const roleGuard: CanActivateChildFn = (route, state) => {
  const store = inject(IamStore);
  store.checkSessionExpiration();
  const user = store.activeUser();
  const router = inject(Router);

  if (!user) {
    return router.createUrlTree(['/iam/sign-in'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const roles = route.data['roles'] as readonly UserRole[] | undefined;

  return !roles || roles.includes(user.experience) ? true : router.parseUrl(user.initialRoute);
};
