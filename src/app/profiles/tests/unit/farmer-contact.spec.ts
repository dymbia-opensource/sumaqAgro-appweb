import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfilesStore } from '../../application/profiles.store';
import { ProfilesApi } from '../../infrastructure/profiles-api';
import { FarmerProfile } from '../../domain/model/entities/farmer-profile.entity';
import { UpdateFarmerContactCommand } from '../../domain/model/commands/update-farmer-contact.command';

describe('Farmer contact persistence', () => {
  let store: ProfilesStore;
  let response: Subject<FarmerProfile>;
  let original: FarmerProfile;
  let api: {
    getFarmerProfile: ReturnType<typeof vi.fn>;
    updateFarmerProfile: ReturnType<typeof vi.fn>;
  };
  const command = () =>
    new UpdateFarmerContactCommand({ phoneNumber: '987654321', email: 'new@example.com' });

  beforeEach(() => {
    original = new FarmerProfile({
      id: 1,
      userId: 1,
      phoneNumber: '912345678',
      email: 'old@example.com',
    });
    response = new Subject<FarmerProfile>();
    api = {
      getFarmerProfile: vi.fn(() => of(original)),
      updateFarmerProfile: vi.fn(() => response),
    };
    TestBed.configureTestingModule({
      providers: [ProfilesStore, { provide: ProfilesApi, useValue: api }],
    });
    store = TestBed.inject(ProfilesStore);
    store.loadFarmerProfile(1);
  });

  it('confirms only after the API returns and does not change the loaded profile while pending', () => {
    store.saveContact(command());
    expect(store.saving()).toBe(true);
    expect(store.contactSaved()).toBe(false);
    expect(store.profile()?.email).toBe('old@example.com');
    response.next(api.updateFarmerProfile.mock.calls[0][0]);
    response.complete();
    expect(store.contactSaved()).toBe(true);
    expect(store.profile()?.email).toBe('new@example.com');
    expect(store.saving()).toBe(false);
  });

  it('keeps the original profile and reports failure when the API rejects the update', () => {
    store.saveContact(command());
    response.error(new Error('Connection failed'));
    expect(store.contactSaved()).toBe(false);
    expect(store.profile()).toBe(original);
    expect(original.email).toBe('old@example.com');
    expect(store.error()).toBe('Connection failed');
    expect(store.saving()).toBe(false);
  });

  it('does not submit a second update while one is pending', () => {
    store.saveContact(command());
    store.saveContact(command());
    expect(api.updateFarmerProfile).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid input without mutating the original profile or sending a request', () => {
    store.saveContact(
      new UpdateFarmerContactCommand({ phoneNumber: '987654321', email: 'invalid' }),
    );
    expect(api.updateFarmerProfile).not.toHaveBeenCalled();
    expect(original.phoneNumber).toBe('912345678');
    expect(store.contactSaved()).toBe(false);
    expect(store.error()).toBeTruthy();
  });
});
