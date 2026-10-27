import { computed, inject, Service } from '@angular/core';
import { IamStore } from './iam.store';
import { UserRole } from '../domain/model/entities/user-role';

export interface SessionParticipant {
  readonly id: number;
  readonly displayName: string;
  readonly experience: UserRole;
  readonly initialRoute: string;
}

const ROLE_PRIORITY: readonly UserRole[] = ['COOPERATIVE_DIRECTOR', 'AGRONOMIST', 'FARMER'];

const INITIAL_ROUTES: Record<UserRole, string> = {
  FARMER: '/field-management/dashboard',
  COOPERATIVE_DIRECTOR: '/profiles/cooperative/dashboard',
  AGRONOMIST: '/crop-health/inbox',
};

/**
 * Projects the authenticated identity for the application contexts.
 */
@Service()
export class CurrentSessionService {
  private readonly iamStore = inject(IamStore);

  readonly activeUser = computed<SessionParticipant | null>(() => {
    const user = this.iamStore.currentUser();

    if (!user) return null;

    const experience = ROLE_PRIORITY.find((role) => user.hasRole(role));

    if (!experience) return null;

    // Existing context APIs currently require positive numeric user IDs.
    const id =
      typeof user.id === 'number' ? user.id : /^[0-9]+$/.test(user.id) ? Number(user.id) : NaN;

    if (!Number.isSafeInteger(id) || id <= 0) return null;

    return {
      id,
      displayName: user.email,
      experience,
      initialRoute: INITIAL_ROUTES[experience],
    };
  });

  readonly hasActiveUser = computed(() => this.activeUser() !== null);
}
