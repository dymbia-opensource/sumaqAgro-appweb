import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { delay, finalize, Observable, of, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RequestPasswordResetCommand } from '../domain/model/commands/request-password-reset.command';
import { ResetPasswordCommand } from '../domain/model/commands/reset-password.command';
import { IamApi } from '../infrastructure/iam-api';

export type PasswordRecoveryError =
  'INVALID_LINK' | 'RATE_LIMITED' | 'CONNECTION_ERROR' | 'REQUEST_REJECTED' | 'UNEXPECTED_ERROR';

/** View-scoped recovery state, independent of the authenticated session. */
@Service()
export class PasswordRecoveryStore {
  private readonly api = inject(IamApi);
  private readonly state = signal<'idle' | 'pending' | 'completed'>('idle');
  private readonly errorSignal = signal<PasswordRecoveryError | null>(null);
  private request?: Subscription;

  readonly isPreview = !environment.production && environment.useMockAuthentication;
  readonly isLoading = computed(() => this.state() === 'pending');
  readonly completed = computed(() => this.state() === 'completed');
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  requestReset(command: RequestPasswordResetCommand): void {
    if (this.isLoading() || this.completed()) return;
    this.execute(
      this.isPreview ? of(undefined).pipe(delay(300)) : this.api.requestPasswordReset(command),
      false,
    );
  }

  resetPassword(command: ResetPasswordCommand): void {
    if (this.isLoading() || this.completed()) return;
    this.execute(
      this.isPreview ? of(undefined).pipe(delay(300)) : this.api.resetPassword(command),
      true,
    );
  }

  clear(): void {
    this.request?.unsubscribe();
    this.request = undefined;
    this.errorSignal.set(null);
    this.state.set('idle');
  }

  private execute(operation: Observable<void>, resetting: boolean): void {
    this.errorSignal.set(null);
    this.state.set('pending');
    this.request = operation
      .pipe(
        finalize(() => {
          if (this.state() === 'pending') this.state.set('idle');
        }),
      )
      .subscribe({
        next: () => this.state.set('completed'),
        error: (error: unknown) => {
          this.errorSignal.set(this.resolveError(error, resetting));
        },
      });
  }

  private resolveError(error: unknown, resetting: boolean): PasswordRecoveryError {
    if (!(error instanceof HttpErrorResponse)) return 'UNEXPECTED_ERROR';
    if (error.status === 0) return 'CONNECTION_ERROR';
    if (error.status === 429) return 'RATE_LIMITED';
    if (resetting && [401, 404, 410].includes(error.status)) return 'INVALID_LINK';
    if ([400, 422].includes(error.status)) return 'REQUEST_REJECTED';
    return 'UNEXPECTED_ERROR';
  }
}
