import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { IamStore } from '../application/iam.store';
import { SignInCommand } from '../domain/model/commands/sign-in.command';
import { iamInterceptor } from './iam.interceptor';
import { MOCK_SESSION_STORAGE_KEY, MockSessionStorage } from './mock-session.storage';

describe('IAM interceptor session rejection', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let store: IamStore;
  const base = environment.platformProviderApiBaseUrl.replace(/\/+$/, '');
  const signInUrl = `${base}${environment.platformProviderSignInEndpointPath}`;
  const resourceUrl = `${base}/field-plots`;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([iamInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    vi.spyOn(TestBed.inject(MockSessionStorage), 'enabled', 'get').mockReturnValue(true);
    store = TestBed.inject(IamStore);
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  function login(token = 'mock-session-current'): void {
    store.signIn(new SignInCommand({ email: 'farmer@example.com', password: 'example-password' }));
    const request = http.expectOne(signInUrl);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ id: 1000, email: 'farmer@example.com', roles: ['ROLE_FARMER'], token });
  }

  it('clears the rejected session and propagates the original HTTP error', () => {
    login();
    let received: HttpErrorResponse | undefined;
    client.get(resourceUrl).subscribe({ error: (error) => (received = error) });
    const request = http.expectOne(resourceUrl);
    expect(request.request.headers.get('Authorization')).toBe('Bearer mock-session-current');
    request.flush({ message: 'Session revoked' }, { status: 401, statusText: 'Unauthorized' });
    expect(store.isSignedIn()).toBe(false);
    expect(store.currentToken()).toBeNull();
    expect(store.sessionExpiresAt()).toBeNull();
    expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).toBeNull();
    expect(received).toBeInstanceOf(HttpErrorResponse);
    expect(received?.status).toBe(401);
    expect(received?.error).toEqual({ message: 'Session revoked' });
    http.expectNone(signInUrl);
  });

  it.each([403, 404, 500])('preserves the session after HTTP %s', (status) => {
    login();
    const participant = store.currentUser();
    client.get(resourceUrl).subscribe({ error: () => {} });
    http.expectOne(resourceUrl).flush({}, { status, statusText: 'Request failed' });
    expect(store.currentUser()).toBe(participant);
  });

  it('preserves the session after a connection failure', () => {
    login();
    client.get(resourceUrl).subscribe({ error: () => {} });
    http.expectOne(resourceUrl).error(new ProgressEvent('error'));
    expect(store.isSignedIn()).toBe(true);
  });

  it('keeps invalid login credentials as a form error', () => {
    store.signIn(new SignInCommand({ email: 'farmer@example.com', password: 'wrong' }));
    http.expectOne(signInUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(store.error()).toBe('INVALID_CREDENTIALS');
    expect(store.isLoading()).toBe(false);
  });

  it.each([
    environment.platformProviderSignUpEndpointPath,
    environment.platformProviderPasswordRecoveryEndpointPath,
  ])('does not invalidate the current session for a public authentication operation %s', (path) => {
    login();
    client.post(`${base}${path}?source=form`, {}).subscribe({ error: () => {} });
    const request = http.expectOne(`${base}${path}?source=form`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(store.isSignedIn()).toBe(true);
  });

  it.each(['https://external.example.com/data', `${base}-other/field-plots`])(
    'does not send credentials or invalidate IAM for an unrelated URL %s',
    (url) => {
      login();
      client.get(url).subscribe({ error: () => {} });
      const request = http.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush({}, { status: 401, statusText: 'Unauthorized' });
      expect(store.isSignedIn()).toBe(true);
    },
  );

  it('respects an explicitly supplied Authorization header', () => {
    login();
    client
      .get(resourceUrl, { headers: { Authorization: 'Bearer another-credential' } })
      .subscribe({ error: () => {} });
    const request = http.expectOne(resourceUrl);
    expect(request.request.headers.get('Authorization')).toBe('Bearer another-credential');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(store.isSignedIn()).toBe(true);
  });

  it.each(['mock-session-new', 'mock-session-current'])(
    'ignores a late rejection after a new login with token %s',
    (token) => {
      login();
      client.get(resourceUrl).subscribe({ error: () => {} });
      const oldRequest = http.expectOne(resourceUrl);
      login(token);
      const currentParticipant = store.currentUser();
      oldRequest.flush({}, { status: 401, statusText: 'Unauthorized' });
      expect(store.currentUser()).toBe(currentParticipant);
      expect(store.currentToken()).toBe(token);
      expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).not.toBeNull();
    },
  );

  it('handles concurrent rejections without repeating sign-out', () => {
    login();
    const signOut = vi.spyOn(store, 'signOut');
    client.get(`${resourceUrl}?page=1`).subscribe({ error: () => {} });
    client.get(`${resourceUrl}?page=2`).subscribe({ error: () => {} });
    http.expectOne(`${resourceUrl}?page=1`).flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectOne(`${resourceUrl}?page=2`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('does not let an old request interrupt a pending new login', () => {
    login();
    client.get(resourceUrl).subscribe({ error: () => {} });
    const oldRequest = http.expectOne(resourceUrl);
    store.signIn(new SignInCommand({ email: 'farmer@example.com', password: 'example-password' }));
    const loginRequest = http.expectOne(signInUrl);
    oldRequest.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(store.isLoading()).toBe(true);
    expect(loginRequest.cancelled).toBe(false);
    loginRequest.flush({
      id: 1001,
      email: 'other@example.com',
      roles: ['ROLE_AGRONOMIST'],
      token: 'mock-session-other',
    });
    expect(store.currentUser()?.email).toBe('other@example.com');
  });
});
