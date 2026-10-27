import { HttpErrorResponse } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { finalize, Subscription } from 'rxjs';
import { SignInCommand } from '../domain/model/commands/sign-in.command';
import { SignUpCommand } from '../domain/model/commands/sign-up.command';
import { AuthenticatedUser } from '../domain/model/entities/authenticated-user.entity';
import { IamApi } from '../infrastructure/iam-api';
import { MockSessionStorage } from '../infrastructure/mock-session.storage';

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
  private readonly sessionStorage = inject(MockSessionStorage);
  private readonly expiresAtSignal = signal<number | null>(null);
  private expirationTimer?: ReturnType<typeof setTimeout>;
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
      this.scheduleExpiration();
    }

    const document = inject(DOCUMENT);
    const window = document.defaultView;
    const checkExpiration = () => this.checkSessionExpiration();
    window?.addEventListener('focus', checkExpiration);
    window?.addEventListener('pageshow', checkExpiration);
    document.addEventListener('visibilitychange', checkExpiration);

    inject(DestroyRef).onDestroy(() => {
      this.activeRequest?.unsubscribe();
      this.clearExpirationTimer();
      window?.removeEventListener('focus', checkExpiration);
      window?.removeEventListener('pageshow', checkExpiration);
      document.removeEventListener('visibilitychange', checkExpiration);
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
          this.expiresAtSignal.set(session?.expiresAt ?? null);
          this.currentUserSignal.set(user);
          this.scheduleExpiration();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.resolveError(error, 'sign-in'));
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
    this.clearExpirationTimer();
    this.expiresAtSignal.set(null);
    this.sessionStorage.clear();
    this.pendingOperationSignal.set(null);
    this.currentUserSignal.set(null);
    this.errorSignal.set(null);
    this.registrationCompletedSignal.set(false);
  }

  /** Rechecks wall-clock expiration after suspension and before guarded access. */
  checkSessionExpiration(): void {
    const expiresAt = this.expiresAtSignal();
    if (expiresAt !== null && Date.now() >= expiresAt) this.signOut();
  }

  private scheduleExpiration(): void {
    this.clearExpirationTimer();
    const expiresAt = this.expiresAtSignal();
    if (expiresAt === null) return;

    this.expirationTimer = setTimeout(
      () => {
        this.checkSessionExpiration();
        // Recalculate if the system clock moved backwards while waiting.
        if (this.expiresAtSignal() !== null) this.scheduleExpiration();
      },
      Math.max(0, expiresAt - Date.now()),
    );
  }

  private clearExpirationTimer(): void {
    if (this.expirationTimer !== undefined) clearTimeout(this.expirationTimer);
    this.expirationTimer = undefined;
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
