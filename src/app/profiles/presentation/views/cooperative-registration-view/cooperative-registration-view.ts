import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { ProfilesStore } from '../../../application/profiles.store';
import { RegisterCooperativeCommand } from '../../../domain/model/commands/register-cooperative.command';

/** Form that registers the institutional profile of a cooperative. */
@Component({
  selector: 'app-cooperative-registration-view',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './cooperative-registration-view.html',
  styleUrl: './cooperative-registration-view.css',
})
export class CooperativeRegistrationView {
  private readonly store = inject(ProfilesStore);
  private readonly router = inject(Router);

  readonly saving = this.store.saving;
  readonly error = this.store.error;
  private readonly submitted = signal(false);
  readonly form = new FormGroup({
    legalName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    region: new FormControl('', { nonNullable: true, validators: Validators.required }),
    institutionalEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    legalRepresentative: new FormControl('', { nonNullable: true, validators: Validators.required }),
    ruc: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{11}$/)] }),
    headquartersAddress: new FormControl('', { nonNullable: true, validators: Validators.required }),
    switchboardPhone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(7)] }),
  });

  constructor() {
    effect(() => {
      if (this.submitted() && !this.saving() && this.store.cooperative()) {
        this.router.navigate(['/profiles/cooperative/dashboard']);
      }
    });
  }

  register(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      const command = new RegisterCooperativeCommand({
        directorUserId: environment.demoUserId,
        ...this.form.getRawValue(),
      });
      this.submitted.set(true);
      this.store.registerCooperative(command);
    } catch (error) {
      // Command validation preserves domain rules if the form is bypassed.
      this.form.setErrors({ domain: error instanceof Error ? error.message : 'Invalid data.' });
    }
  }
}
