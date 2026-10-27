import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { routes } from '../../app.routes';
import { CurrentSessionService } from '../../shared/application/current-session.service';
import { environment } from '../../../environments/environment';
import { SignInCommand } from '../domain/model/commands/sign-in.command';
import { SignUpCommand } from '../domain/model/commands/sign-up.command';
import { UserRole } from '../domain/model/entities/user-role';
import { iamGuard } from '../infrastructure/iam.guard';
import { roleGuard } from '../infrastructure/role.guard';
import { AuthNavigationService } from './auth-navigation.service';
import { IamStore } from './iam.store';

describe('Authenticated navigation', () => {
  let store: IamStore;
  let http: HttpTestingController;
  let router: Router;
  let navigation: AuthNavigationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(IamStore);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    navigation = TestBed.inject(AuthNavigationService);
  });

  afterEach(() => http.verify());

  function signIn(role: UserRole): void {
    store.signIn(new SignInCommand({ email: 'user@example.com', password: 'example-password' }));
    const request = http.expectOne(
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderSignInEndpointPath}`,
    );
    request.flush({
      id: 1000,
      email: 'user@example.com',
      roles: [`ROLE_${role}`],
      token: 'test-token',
    });
  }

  it.each([
    ['FARMER', '/field-management/dashboard'],
    ['COOPERATIVE_DIRECTOR', '/profiles/cooperative/dashboard'],
    ['AGRONOMIST', '/crop-health/inbox'],
  ] as const)('supports registration, login and logout for %s', (role, destination) => {
    store.signUp(
      new SignUpCommand({ email: 'user@example.com', password: 'example-password', role }),
    );
    const request = http.expectOne(
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderSignUpEndpointPath}`,
    );
    expect(request.request.body.roles).toEqual([`ROLE_${role}`]);
    request.flush({ id: 1000, email: 'user@example.com', roles: [`ROLE_${role}`] });
    expect(store.registrationCompleted()).toBe(true);
    expect(store.isSignedIn()).toBe(false);

    signIn(role);
    expect(router.serializeUrl(navigation.destination(null))).toBe(destination);
    expect(TestBed.inject(CurrentSessionService).activeUser()?.experience).toBe(role);

    store.signOut();
    expect(store.currentToken()).toBeNull();
    expect(TestBed.inject(CurrentSessionService).activeUser()).toBeNull();
    const result = TestBed.runInInjectionContext(() =>
      iamGuard({} as ActivatedRouteSnapshot, { url: destination } as RouterStateSnapshot),
    );
    expect(router.serializeUrl(result as UrlTree)).toBe(
      `/iam/sign-in?returnUrl=${encodeURIComponent(destination)}`,
    );
  });

  it('preserves an internal return URL including query and fragment', () => {
    signIn('FARMER');
    const url = '/field-management/plots?sort=name#selected';
    expect(router.serializeUrl(navigation.destination(url))).toBe(url);
  });

  it.each([
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/iam/sign-in',
    '/demo-access',
    '/verify/public-token',
    '/field-management-other/plots',
    '/field-management/../iam/sign-in',
    '/field-management/%2F%2Fexample.com',
    '/field-management/plots;redirect=external',
    '/field-management/plots(aux:other)',
  ])('rejects unsafe or unsupported return URL %s', (url) => {
    signIn('FARMER');
    expect(router.serializeUrl(navigation.destination(url))).toBe('/field-management/dashboard');
  });

  it('does not grant access when credentials are rejected', () => {
    store.signIn(new SignInCommand({ email: 'user@example.com', password: 'wrong' }));
    http
      .expectOne(
        `${environment.platformProviderApiBaseUrl}${environment.platformProviderSignInEndpointPath}`,
      )
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(store.error()).toBe('INVALID_CREDENTIALS');
    expect(router.serializeUrl(navigation.destination('/field-management/plots'))).toBe(
      '/iam/sign-in',
    );
  });

  it('enforces route roles even when a private URL is supplied after login', () => {
    signIn('FARMER');
    const result = TestBed.runInInjectionContext(() =>
      roleGuard(
        { data: { roles: ['AGRONOMIST'] } } as unknown as ActivatedRouteSnapshot,
        { url: '/crop-health/prescribe' } as RouterStateSnapshot,
      ),
    );
    expect(router.serializeUrl(result as UrlTree)).toBe('/field-management/dashboard');
  });

  it('protects both shell activation and subsequent child navigation', () => {
    const shell = routes.find((route) => route.loadComponent && route.children);
    expect(shell?.canActivate).toContain(iamGuard);
    expect(shell?.canActivateChild).toContain(iamGuard);
    expect(routes.some((route) => route.path === 'demo-access')).toBe(false);
    expect(
      routes.find((route) => route.path === '' && route.pathMatch === 'full')?.redirectTo,
    ).toBe('/iam/sign-in');
    expect(routes.find((route) => route.path === 'verify/:token')?.canActivate).toBeUndefined();
  });
});
