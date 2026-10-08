import { inject, Service, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { UpdateFarmerContactCommand } from '../domain/model/commands/update-farmer-contact.command';
import { FarmerProfile } from '../domain/model/entities/farmer-profile.entity';
import { ProfilesApi } from '../infrastructure/profiles-api';

/** Application state and use cases for the independent farmer profile. */
@Service()
export class ProfilesStore {
  private readonly profilesApi = inject(ProfilesApi);
  private readonly profileSignal = signal<FarmerProfile | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly profile = this.profileSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  loadFarmerProfile(userId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.profilesApi
      .getFarmerProfile(userId)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (profile) => this.profileSignal.set(profile),
        error: (error: Error) => this.errorSignal.set(error.message),
      });
  }

  saveContact(command: UpdateFarmerContactCommand): void {
    const profile = this.profileSignal();
    if (!profile) return;

    try {
      profile.updateContact(command.phoneNumber, command.email);
    } catch (error) {
      this.errorSignal.set(error instanceof Error ? error.message : 'Invalid contact data.');
      return;
    }

    this.savingSignal.set(true);
    this.errorSignal.set(null);
    this.profilesApi
      .updateFarmerProfile(profile)
      .pipe(finalize(() => this.savingSignal.set(false)))
      .subscribe({
        next: (updatedProfile) => this.profileSignal.set(updatedProfile),
        error: (error: Error) => this.errorSignal.set(error.message),
      });
  }
}
