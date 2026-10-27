import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { IamStore } from '../../application/iam.store';
import { RequestPasswordResetCommand } from '../../domain/model/commands/request-password-reset.command';
import { ResetPasswordCommand } from '../../domain/model/commands/reset-password.command';
import { SignInCommand } from '../../domain/model/commands/sign-in.command';
import { IamApi } from '../../infrastructure/iam-api';
import { iamInterceptor } from '../../infrastructure/iam.interceptor';

describe('Password recovery API integration', () => {
  const originalMockAuthentication = environment.useMockAuthentication;
  let api: IamApi;
  let http: HttpTestingController;
  const recoveryUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderPasswordRecoveryEndpointPath}`;

  beforeEach(() => {
    // These tests exercise HTTP contracts rather than the development preview adapter.
    environment.useMockAuthentication = false;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([iamInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(IamApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    environment.useMockAuthentication = originalMockAuthentication;
  });

  it('accepts an empty successful response without requiring account information', () => {
    const completed = vi.fn();
    api
      .requestPasswordReset(new RequestPasswordResetCommand({ email: ' farmer@example.com ' }))
      .subscribe({ complete: completed });
    const request = http.expectOne(recoveryUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'farmer@example.com' });
    request.flush(null, { status: 202, statusText: 'Accepted' });
    expect(completed).toHaveBeenCalledOnce();
  });

  it('sends only the recovery token and new password, preserving password whitespace', () => {
    api
      .resetPassword(
        new ResetPasswordCommand({ token: ' recovery-token ', newPassword: ' new password ' }),
      )
      .subscribe();
    const request = http.expectOne(`${recoveryUrl}/reset`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      token: 'recovery-token',
      newPassword: ' new password ',
    });
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('preserves an existing session when the public reset endpoint rejects its recovery token', () => {
    const store = TestBed.inject(IamStore);
    store.signIn(new SignInCommand({ email: 'farmer@example.com', password: 'example-password' }));
    http
      .expectOne(
        `${environment.platformProviderApiBaseUrl}${environment.platformProviderSignInEndpointPath}`,
      )
      .flush({
        id: 1000,
        email: 'farmer@example.com',
        roles: ['ROLE_FARMER'],
        token: 'test-token',
      });
    const participant = store.currentUser();
    let received: HttpErrorResponse | undefined;
    api
      .resetPassword(
        new ResetPasswordCommand({ token: 'expired-token', newPassword: 'new-password' }),
      )
      .subscribe({ error: (error) => (received = error) });
    const request = http.expectOne(`${recoveryUrl}/reset`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ code: 'RECOVERY_TOKEN_EXPIRED' }, { status: 401, statusText: 'Unauthorized' });
    expect(store.currentUser()).toBe(participant);
    expect(received?.status).toBe(401);
    expect(received?.error.code).toBe('RECOVERY_TOKEN_EXPIRED');
  });
});
