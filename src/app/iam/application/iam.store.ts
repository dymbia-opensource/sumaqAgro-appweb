import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { finalize, Subscription } from 'rxjs';
import { SignInCommand } from '../domain/model/commands/sign-in.command';
import { SignUpCommand } from '../domain/model/commands/sign-up.command';
import { AuthenticatedUser } from '../domain/model/entities/authenticated-user.entity';
import { IamApi } from '../infrastructure/iam-api';
import { SessionStorageService } from '../infrastructure/session/session-storage-service';
import { SessionExpirationService } from '../infrastructure/session/session-expiration.service';

export type IamError =
  | 'INVALID_CREDENTIALS'
  | 'REGISTRATION_CONFLICT'
  | 'ACCESS_DENIED'
  | 'CONNECTION_ERROR'
  | 'UNEXPECTED_ERROR';

type IamOperation = 'sign-in' | 'sign-up';

/**
 * Holds IAM state and orchestrates authentication operations.
 */
@Service()
export class IamStore {
  private readonly iamApi = inject(IamApi);
  private readonly sessionStorage = inject(SessionStorageService);
  private readonly sessionExpiration = inject(SessionExpirationService);
  private readonly expiresAtSignal = signal<number | null>(null);
  private activeRequest?: Subscription;

  private readonly currentUserSignal = signal<AuthenticatedUser | null>(null);
  private readonly pendingOperationSignal = signal<IamOperation | null>(null);
  private readonly errorSignal = signal<IamError | null>(null);
  private readonly registrationCompletedSignal = signal(false);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly pendingOperation = this.pendingOperationSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly registrationCompleted = this.registrationCompletedSignal.asReadonly();
  readonly sessionExpiresAt = this.expiresAtSignal.asReadonly();

  readonly isSignedIn = computed(() => this.currentUser() !== null);
  readonly currentToken = computed(() => this.currentUser()?.token ?? null);
  readonly isLoading = computed(() => this.pendingOperation() !== null);

  constructor() {
    const restored = this.sessionStorage.restore();

    if (restored) {
      this.currentUserSignal.set(restored.user);
      this.expiresAtSignal.set(restored.expiresAt);

      this.sessionExpiration.start(restored.expiresAt, () => this.signOut());
    }

    inject(DestroyRef).onDestroy(() => {
      this.activeRequest?.unsubscribe();
      this.sessionExpiration.stop();
    });
  }

  signIn(command: SignInCommand): void {
    if (this.isLoading()) return;

    this.signOut();
    this.pendingOperationSignal.set('sign-in');

    this.activeRequest = this.iamApi
      .signIn(command)
      .pipe(finalize(() => this.pendingOperationSignal.set(null)))
      .subscribe({
        next: (user) => {
          const session = this.sessionStorage.save(user);
          const expiresAt = session?.expiresAt ?? null;

          this.expiresAtSignal.set(expiresAt);
          this.currentUserSignal.set(user);

          this.sessionExpiration.start(expiresAt, () => this.signOut());
        },
      });
  }

  signUp(command: SignUpCommand): void {
    if (this.isLoading()) return;

    this.errorSignal.set(null);
    this.registrationCompletedSignal.set(false);
    this.pendingOperationSignal.set('sign-up');

    this.activeRequest = this.iamApi
      .signUp(command)
      .pipe(finalize(() => this.pendingOperationSignal.set(null)))
      .subscribe({
        next: () => {
          this.registrationCompletedSignal.set(true);
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.resolveError(error, 'sign-up'));
        },
      });
  }

  signOut(): void {
    this.activeRequest?.unsubscribe();
    this.activeRequest = undefined;
    this.sessionExpiration.stop();
    this.expiresAtSignal.set(null);
    this.sessionStorage.clear();
    this.pendingOperationSignal.set(null);
    this.currentUserSignal.set(null);
    this.errorSignal.set(null);
    this.registrationCompletedSignal.set(false);
  }

  /** Rechecks wall-clock expiration after suspension and before guarded access. */
  checkSessionExpiration(): void {
    this.sessionExpiration.check();
  }

  clearFeedback(): void {
    this.errorSignal.set(null);
    this.registrationCompletedSignal.set(false);
  }

  private resolveError(error: unknown, operation: IamOperation): IamError {
    if (!(error instanceof HttpErrorResponse)) {
      return 'UNEXPECTED_ERROR';
    }

    switch (error.status) {
      case 0:
        return 'CONNECTION_ERROR';

      case 401:
        return operation === 'sign-in' ? 'INVALID_CREDENTIALS' : 'ACCESS_DENIED';

      case 403:
        return 'ACCESS_DENIED';

      case 409:
        return operation === 'sign-up' ? 'REGISTRATION_CONFLICT' : 'UNEXPECTED_ERROR';

      default:
        return 'UNEXPECTED_ERROR';
    }
  }
}
