import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { CurrentSessionService } from '../application/current-session.service';
import { UserRole } from '../domain/model/entities/user-role';
import { IamStore } from '../application/iam.store';

/** Checks route permissions against the session's active role; the API enforces authorization. */
export const roleGuard: CanActivateChildFn = (route, state) => {
  inject(IamStore).checkSessionExpiration();
  const user = inject(CurrentSessionService).activeUser();
  const router = inject(Router);

  if (!user) {
    return router.createUrlTree(['/iam/sign-in'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const roles = route.data['roles'] as readonly UserRole[] | undefined;

  return !roles || roles.includes(user.experience) ? true : router.parseUrl(user.initialRoute);
};
