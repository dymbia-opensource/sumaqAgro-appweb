import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DemoSessionService } from '../../shared/application/demo-session.service';
import { UserExperience } from '../../shared/domain/model/demo-user';
/** Demo navigation guard; the production API must enforce authentication and authorization. */
export const cropHealthGuard: CanActivateFn = route => {
  const user = inject(DemoSessionService).activeUser();
  const router = inject(Router);
  if (!user) return router.parseUrl('/demo-access');
  const roles = route.data['roles'] as UserExperience[] | undefined;
  return !roles || roles.includes(user.experience) ? true : router.parseUrl('/crop-health/inbox');
};
