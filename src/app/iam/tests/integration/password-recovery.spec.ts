import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { PasswordRecoveryStore } from '../../application/password-recovery.store';
import { iamRoutes } from '../../iam.routes';
import { ForgotPasswordForm } from '../../presentation/views/forgot-password-form/forgot-password-form';
import { ResetPasswordForm } from '../../presentation/views/reset-password-form/reset-password-form';

describe('Password recovery views', () => {
  const originalProduction = environment.production;
  const originalMock = environment.useMockAuthentication;
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  beforeEach(async () => {
    environment.production = false;
    environment.useMockAuthentication = true;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'iam', children: iamRoutes }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    http.verify();
    environment.production = originalProduction;
    environment.useMockAuthentication = originalMock;
    vi.restoreAllMocks();
  });

  function input(name: string, value: string): void {
    const element = harness.routeNativeElement!.querySelector<HTMLInputElement>(
      `[formControlName="${name}"]`,
    )!;
    element.value = value;
    element.dispatchEvent(new Event('input'));
    harness.detectChanges();
  }

  function submit(): void {
    harness
      .routeNativeElement!.querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    harness.detectChanges();
  }

  it('blocks an invalid email before requesting recovery', async () => {
    await harness.navigateByUrl('/iam/forgot-password', ForgotPasswordForm);
    const store = harness.routeDebugElement!.injector.get(PasswordRecoveryStore);
    const request = vi.spyOn(store, 'requestReset');
    input('email', 'invalid-email');
    submit();
    expect(request).not.toHaveBeenCalled();
    expect(harness.routeNativeElement!.querySelector('mat-error')).not.toBeNull();
  });

  it('provides a clearly marked preview and a link to explore password reset', async () => {
    await harness.navigateByUrl('/iam/forgot-password', ForgotPasswordForm);
    const store = harness.routeDebugElement!.injector.get(PasswordRecoveryStore);
    input('email', 'farmer@example.com');
    submit();
    expect(store.isLoading()).toBe(true);
    expect(
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]')!
        .disabled,
    ).toBe(true);
    await vi.waitFor(() => expect(store.completed()).toBe(true));
    harness.detectChanges();
    expect(store.completed()).toBe(true);
    expect(harness.routeNativeElement!.querySelector('.preview-notice')).not.toBeNull();
    expect(
      harness.routeNativeElement!.querySelector('a[href="/reset-password?token=preview-only"]'),
    ).toBeNull();
    // The preview link always targets the public IAM URL used in the application.
    expect(
      harness.routeNativeElement!.querySelector('a[href="/iam/reset-password?token=preview-only"]'),
    ).not.toBeNull();
    http.expectNone(() => true);
  });

  it('does not allow password submission without a recovery token', async () => {
    await harness.navigateByUrl('/iam/reset-password', ResetPasswordForm);
    expect(harness.routeNativeElement!.querySelector('form')).toBeNull();
    expect(harness.routeNativeElement!.querySelector('[role="alert"]')).not.toBeNull();
    expect(
      harness.routeNativeElement!.querySelector('a[href="/iam/forgot-password"]'),
    ).not.toBeNull();
  });

  it('blocks mismatched passwords and keeps them hidden by default', async () => {
    await harness.navigateByUrl('/iam/reset-password?token=preview-only', ResetPasswordForm);
    const store = harness.routeDebugElement!.injector.get(PasswordRecoveryStore);
    const reset = vi.spyOn(store, 'resetPassword');
    input('newPassword', 'new-password');
    input('confirmation', 'different-password');
    submit();
    expect(reset).not.toHaveBeenCalled();
    expect(harness.routeNativeElement!.querySelector('.validation-error')).not.toBeNull();
    expect(
      harness.routeNativeElement!.querySelector<HTMLInputElement>(
        '[formControlName="newPassword"]',
      )!.type,
    ).toBe('password');
  });

  it('validates matching passwords in preview without sending them to the backend', async () => {
    await harness.navigateByUrl('/iam/reset-password?token=preview-only', ResetPasswordForm);
    const store = harness.routeDebugElement!.injector.get(PasswordRecoveryStore);
    input('newPassword', 'new-password');
    input('confirmation', 'new-password');
    submit();
    await vi.waitFor(() => expect(store.completed()).toBe(true));
    harness.detectChanges();
    expect(store.completed()).toBe(true);
    expect(harness.routeNativeElement!.querySelector('.result-panel')).not.toBeNull();
    expect(harness.routeNativeElement!.querySelector('form')).toBeNull();
    http.expectNone(() => true);
  });

  it('clears the draft and pending result when the token changes', async () => {
    await harness.navigateByUrl('/iam/reset-password?token=first', ResetPasswordForm);
    input('newPassword', 'new-password');
    input('confirmation', 'new-password');
    submit();
    await harness.navigateByUrl('/iam/reset-password?token=second', ResetPasswordForm);
    const store = harness.routeDebugElement!.injector.get(PasswordRecoveryStore);
    expect(store.completed()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(
      harness.routeNativeElement!.querySelector<HTMLInputElement>(
        '[formControlName="newPassword"]',
      )!.value,
    ).toBe('');
  });

  it('shows a rejected recovery link when the real API returns expiration', async () => {
    environment.useMockAuthentication = false;
    await harness.navigateByUrl('/iam/reset-password?token=expired', ResetPasswordForm);
    input('newPassword', 'new-password');
    input('confirmation', 'new-password');
    submit();
    http
      .expectOne(
        `${environment.platformProviderApiBaseUrl}${environment.platformProviderPasswordRecoveryEndpointPath}/reset`,
      )
      .flush({}, { status: 410, statusText: 'Gone' });
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('form')).toBeNull();
    expect(harness.routeNativeElement!.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('shows rate limiting without displaying the server response text', async () => {
    environment.useMockAuthentication = false;
    await harness.navigateByUrl('/iam/forgot-password', ForgotPasswordForm);
    input('email', 'farmer@example.com');
    submit();
    http
      .expectOne(
        `${environment.platformProviderApiBaseUrl}${environment.platformProviderPasswordRecoveryEndpointPath}`,
      )
      .flush(
        { message: 'Private account information' },
        { status: 429, statusText: 'Too Many Requests' },
      );
    harness.detectChanges();
    const store = harness.routeDebugElement!.injector.get(PasswordRecoveryStore);
    expect(store.error()).toBe('RATE_LIMITED');
    expect(store.isLoading()).toBe(false);
    expect(harness.routeNativeElement!.textContent).not.toContain('Private account information');
  });
});
