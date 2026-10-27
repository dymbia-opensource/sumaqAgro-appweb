import { TestBed } from '@angular/core/testing';
import { AuthenticatedUser } from '../domain/model/entities/authenticated-user.entity';
import {
  MOCK_SESSION_DURATION_MS,
  MOCK_SESSION_STORAGE_KEY,
  MockSessionStorage,
} from './mock-session.storage';

describe('MockSessionStorage', () => {
  let storage: MockSessionStorage;
  const now = Date.UTC(2026, 9, 27, 12);

  function user(token = 'mock-session-example'): AuthenticatedUser {
    return new AuthenticatedUser({
      id: 1000,
      email: 'farmer@example.com',
      roles: ['FARMER'],
      token,
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    storage = TestBed.inject(MockSessionStorage);
    vi.spyOn(storage, 'enabled', 'get').mockReturnValue(true);
    vi.spyOn(Date, 'now').mockReturnValue(now);
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('restores an account with its role and the original expiration', () => {
    storage.save(user());
    vi.spyOn(Date, 'now').mockReturnValue(now + 60_000);
    const restored = storage.restore();
    expect(restored?.user.email).toBe('farmer@example.com');
    expect(restored?.user.hasRole('FARMER')).toBe(true);
    expect(restored?.expiresAt).toBe(now + MOCK_SESSION_DURATION_MS);
    expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).not.toContain('password');
  });

  it('discards the session at its expiration boundary', () => {
    storage.save(user());
    vi.spyOn(Date, 'now').mockReturnValue(now + MOCK_SESSION_DURATION_MS);
    expect(storage.restore()).toBeNull();
    expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).toBeNull();
  });

  it.each(['not-json', '{}', 'null', '[]'])('clears malformed stored data %s', (raw) => {
    sessionStorage.setItem(MOCK_SESSION_STORAGE_KEY, raw);
    expect(storage.restore()).toBeNull();
    expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).toBeNull();
  });

  it.each([
    { roles: ['ADMIN'] },
    { roles: [] },
    { id: -1 },
    { id: '1e3' },
    { email: '' },
    { token: 'real-token' },
  ])('rejects invalid account data %j', (changes) => {
    storage.save(user());
    const stored = JSON.parse(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)!);
    Object.assign(stored.user, changes);
    sessionStorage.setItem(MOCK_SESSION_STORAGE_KEY, JSON.stringify(stored));
    expect(storage.restore()).toBeNull();
    expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('does not restore a session with an extended lifetime', () => {
    storage.save(user());
    const stored = JSON.parse(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)!);
    stored.expiresAt += 60_000;
    sessionStorage.setItem(MOCK_SESSION_STORAGE_KEY, JSON.stringify(stored));
    expect(storage.restore()).toBeNull();
  });

  it('never saves real tokens', () => {
    expect(storage.save(user('real-token'))).toBeNull();
    expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('does not use stored simulation data when mock authentication is disabled', () => {
    storage.save(user());
    vi.spyOn(storage, 'enabled', 'get').mockReturnValue(false);
    expect(storage.restore()).toBeNull();
    expect(storage.save(user())).toBeNull();
  });

  it('keeps the storage failure from breaking in-memory sign-in', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Denied');
    });
    expect(storage.save(user())?.expiresAt).toBe(now + MOCK_SESSION_DURATION_MS);
  });

  it('handles storage access failures during restoration and clearing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Denied');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Denied');
    });
    expect(storage.restore()).toBeNull();
    expect(() => storage.clear()).not.toThrow();
  });

  it('clears only the IAM simulation session', () => {
    sessionStorage.setItem('other-context', 'keep');
    storage.save(user());
    storage.clear();
    expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem('other-context')).toBe('keep');
  });
});
