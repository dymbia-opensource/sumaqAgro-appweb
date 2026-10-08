import { Component, effect, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { DemoSessionService } from '../../../../shared/application/demo-session.service';
import { ProfilesStore } from '../../../application/profiles.store';
import { UpdateFarmerContactCommand } from '../../../domain/model/commands/update-farmer-contact.command';

/** Account settings view for the independent farmer (segment 1). */
@Component({
  selector: 'app-farmer-settings-view',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './farmer-settings-view.html',
  styleUrl: './farmer-settings-view.css',
})
export class FarmerSettingsView {
  private readonly store = inject(ProfilesStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly demoSession = inject(DemoSessionService);

  readonly profile = this.store.profile;
  readonly loading = this.store.loading;
  readonly saving = this.store.saving;
  readonly error = this.store.error;

  readonly contactForm = new FormGroup({
    phoneNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(7)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  });

  constructor() {
    const userId = this.demoSession.activeUser()?.id;
    if (userId !== undefined) {
      this.store.loadFarmerProfile(userId);
    }
    effect(() => {
      const profile = this.profile();
      if (profile) {
        this.contactForm.setValue({ phoneNumber: profile.phoneNumber, email: profile.email }, { emitEvent: false });
      }
    });
  }

  saveContact(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.store.saveContact(new UpdateFarmerContactCommand(this.contactForm.getRawValue()));
    this.snackBar.open('Datos de contacto guardados.', undefined, { duration: 3000 });
  }

  passwordChangeUnavailable(): void {
    this.snackBar.open('El cambio de contraseña estará disponible al implementar IAM.', undefined, {
      duration: 3500,
    });
  }
}
