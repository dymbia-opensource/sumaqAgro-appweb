import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterOutlet,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { environment } from '../../../environments/environment';
import { Layout } from '../../shared/presentation/components/layout/layout';
import { LayoutService } from '../../shared/presentation/components/layout/layout.service';
import { SignInCommand } from '../domain/model/commands/sign-in.command';
import { SignUpCommand } from '../domain/model/commands/sign-up.command';
import { AuthenticatedUser } from '../domain/model/entities/authenticated-user.entity';
import { iamGuard } from '../infrastructure/iam.guard';
import { iamInterceptor } from '../infrastructure/iam.interceptor';
import {
  MOCK_SESSION_DURATION_MS,
  MOCK_SESSION_STORAGE_KEY,
  MockSessionStorage,
} from '../infrastructure/mock-session.storage';
import { IamStore } from './iam.store';

describe('IAM simulated session lifecycle', () => {
  let http: HttpTestingController;
  let storage: MockSessionStorage;
  const now = Date.UTC(2026, 9, 27, 12);
  const signInUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderSignInEndpointPath}`;
  const credentials = new SignInCommand({
    email: 'farmer@example.com',
    password: 'example-password',
  });

  function account(token = 'mock-session-example'): AuthenticatedUser {
    return new AuthenticatedUser({
      id: 1000,
      email: 'farmer@example.com',
      roles: ['FARMER'],
      token,
    });
  }

  function login(store: IamStore, token = 'mock-session-example'): void {
    store.signIn(credentials);
    http.expectOne(signInUrl).flush({
      id: 1000,
      email: 'farmer@example.com',
      roles: ['ROLE_FARMER'],
      token,
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([iamInterceptor])),
        provideHttpClientTesting(),
        { provide: LayoutService, useValue: {} },
      ],
    });
    TestBed.overrideComponent(Layout, {
      set: { imports: [RouterOutlet], template: '<router-outlet />' },
    });
    http = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(MockSessionStorage);
    vi.spyOn(storage, 'enabled', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('saves a successful simulated login and expires it after 30 minutes', () => {
    const store = TestBed.inject(IamStore);
    login(store);
    expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).not.toBeNull();
    expect(store.sessionExpiresAt()).toBe(now + MOCK_SESSION_DURATION_MS);
    vi.advanceTimersByTime(MOCK_SESSION_DURATION_MS - 1);
    expect(store.isSignedIn()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(store.isSignedIn()).toBe(false);
    expect(store.currentToken()).toBeNull();
    expect(store.sessionExpiresAt()).toBeNull();
    expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('restores after reload without extending the original expiration', () => {
    storage.save(account());
    vi.setSystemTime(now + 5 * 60_000);
    const store = TestBed.inject(IamStore);
    expect(store.currentUser()?.email).toBe('farmer@example.com');
    expect(store.sessionExpiresAt()).toBe(now + MOCK_SESSION_DURATION_MS);
    vi.advanceTimersByTime(25 * 60_000);
    expect(store.isSignedIn()).toBe(false);
  });

  it('does not restore an already expired session', () => {
    storage.save(account());
    vi.setSystemTime(now + MOCK_SESSION_DURATION_MS);
    expect(TestBed.inject(IamStore).isSignedIn()).toBe(false);
    expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('clears stored state and the timer on explicit logout', () => {
    const store = TestBed.inject(IamStore);
    login(store);
    store.signOut();
    expect(store.currentUser()).toBeNull();
    expect(store.sessionExpiresAt()).toBeNull();
    expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels a pending login so a late response cannot recreate the session', () => {
    const store = TestBed.inject(IamStore);
    store.signIn(credentials);
    const request = http.expectOne(signInUrl);
    expect(store.isLoading()).toBe(true);
    store.signOut();
    expect(request.cancelled).toBe(true);
    expect(store.isLoading()).toBe(false);
    expect(store.isSignedIn()).toBe(false);
    expect(() => request.flush({ token: 'late-token' })).toThrow();
  });

  it('cancels pending registration when the session is closed', () => {
    const store = TestBed.inject(IamStore);
    store.signUp(new SignUpCommand({ ...credentials, role: 'FARMER' }));
    const request = http.expectOne(
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderSignUpEndpointPath}`,
    );
    store.signOut();
    expect(request.cancelled).toBe(true);
    expect(store.registrationCompleted()).toBe(false);
    expect(store.isLoading()).toBe(false);
  });

  it('does not preserve an old session after a failed new login', () => {
    storage.save(account());
    const store = TestBed.inject(IamStore);
    store.signIn(credentials);
    http.expectOne(signInUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(store.isSignedIn()).toBe(false);
    expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('a new login receives a new expiration without retaining the old timer', () => {
    const store = TestBed.inject(IamStore);
    login(store);
    vi.advanceTimersByTime(5 * 60_000);
    login(store, 'mock-session-new');
    vi.advanceTimersByTime(25 * 60_000);
    expect(store.currentToken()).toBe('mock-session-new');
    vi.advanceTimersByTime(5 * 60_000);
    expect(store.isSignedIn()).toBe(false);
  });

  it.each(['focus', 'pageshow', 'visibilitychange'])(
    'rechecks expiration on %s after suspension',
    (event) => {
      const store = TestBed.inject(IamStore);
      login(store);
      vi.setSystemTime(now + MOCK_SESSION_DURATION_MS + 1);
      (event === 'visibilitychange' ? document : window).dispatchEvent(new Event(event));
      expect(store.isSignedIn()).toBe(false);
    },
  );

  it('rejects guarded access when expiration passes while timers are suspended', () => {
    const store = TestBed.inject(IamStore);
    login(store);
    vi.setSystemTime(now + MOCK_SESSION_DURATION_MS);
    const result = TestBed.runInInjectionContext(() =>
      iamGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/field-management/plots' } as RouterStateSnapshot,
      ),
    );
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/iam/sign-in?returnUrl=%2Ffield-management%2Fplots',
    );
  });

  it('never attaches an expired mock token to an outgoing API request', () => {
    const store = TestBed.inject(IamStore);
    login(store);
    vi.setSystemTime(now + MOCK_SESSION_DURATION_MS);
    TestBed.inject(HttpClient)
      .get(`${environment.platformProviderApiBaseUrl}/field-plots`)
      .subscribe();
    const request = http.expectOne(`${environment.platformProviderApiBaseUrl}/field-plots`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
    expect(store.isSignedIn()).toBe(false);
  });

  it('does not persist real authentication responses or invent their expiration', () => {
    const store = TestBed.inject(IamStore);
    login(store, 'real-token');
    expect(store.isSignedIn()).toBe(true);
    expect(store.sessionExpiresAt()).toBeNull();
    expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('expires an in-memory mock session even when persistence is blocked', () => {
    const store = TestBed.inject(IamStore);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Denied');
    });
    login(store);
    expect(store.isSignedIn()).toBe(true);
    vi.advanceTimersByTime(MOCK_SESSION_DURATION_MS);
    expect(store.isSignedIn()).toBe(false);
  });

  it('redirects an open private shell to login when its session expires', () => {
    const store = TestBed.inject(IamStore);
    login(store);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Layout);
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(MOCK_SESSION_DURATION_MS);
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/iam/sign-in'], {
      queryParams: { returnUrl: '/' },
      replaceUrl: true,
    });
  });
});
