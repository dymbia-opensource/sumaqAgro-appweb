import { computed, Service, signal } from '@angular/core';
import { DemoUser } from '../domain/model/demo-user';

const DEMO_SESSION_STORAGE_KEY = 'sumaq-agro-demo-user-id';

export const DEMO_USERS: readonly DemoUser[] = [
  {
    id: 1,
    displayName: 'Guillermo',
    experience: 'FARMER',
    initialRoute: '/field-management/dashboard',
  },
  {
    id: 3,
    displayName: 'Cristian Santana',
    experience: 'COOPERATIVE_DIRECTOR',
    initialRoute: '/profiles/cooperative/dashboard',
  },
  {
    id: 4,
    displayName: 'Ing. Juan A. Morales',
    experience: 'AGRONOMIST',
    initialRoute: '/crop-health/inbox',
  },
];

/**
 * Maintains the selected demo user until IAM replaces this temporary mechanism.
 */
@Service()
export class DemoSessionService {
  readonly users = DEMO_USERS;

  private readonly activeUserSignal = signal<DemoUser | null>(this.restoreUser());

  readonly activeUser = this.activeUserSignal.asReadonly();
  readonly hasActiveUser = computed(() => this.activeUser() !== null);

  selectUser(userId: number): void {
    const user = this.users.find((candidate) => candidate.id === userId);

    if (!user) {
      throw new Error('Demo user not found.');
    }

    this.activeUserSignal.set(user);
    localStorage.setItem(DEMO_SESSION_STORAGE_KEY, String(user.id));
  }

  clearSession(): void {
    this.activeUserSignal.set(null);
    localStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
  }

  private restoreUser(): DemoUser | null {
    const storedUserId = Number(localStorage.getItem(DEMO_SESSION_STORAGE_KEY));

    return this.users.find((user) => user.id === storedUserId) ?? null;
  }
}
