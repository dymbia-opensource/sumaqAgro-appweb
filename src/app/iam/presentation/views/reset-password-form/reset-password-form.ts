import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { PasswordRecoveryStore } from '../../../application/password-recovery.store';
import { ResetPasswordCommand } from '../../../domain/model/commands/reset-password.command';
import { AuthLayout } from '../../components/auth-layout/auth-layout';

function matchingPasswords(control: AbstractControl): ValidationErrors | null {
  return control.get('newPassword')?.value === control.get('confirmation')?.value
    ? null
    : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RouterLink,
    TranslatePipe,
    AuthLayout,
  ],
  providers: [PasswordRecoveryStore],
  templateUrl: './reset-password-form.html',
  styleUrl: './reset-password-form.css',
})
export class ResetPasswordForm {
  protected readonly store = inject(PasswordRecoveryStore);
  protected readonly hidePassword = signal(true);
  protected readonly hideConfirmation = signal(true);
  private readonly token = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((params) => params.get('token')?.trim() ?? '')),
    { initialValue: '' },
  );
  protected readonly invalidLink = computed(
    () => !this.token() || this.store.error() === 'INVALID_LINK',
  );

  protected readonly form = new FormGroup(
    {
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmation: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: matchingPasswords },
  );

  constructor() {
    effect(() => {
      this.token();
      untracked(() => {
        this.store.clear();
        this.form.reset();
        this.hidePassword.set(true);
        this.hideConfirmation.set(true);
      });
    });
    effect(() => {
      if (this.store.completed()) untracked(() => this.form.reset());
    });
  }

  protected submit(): void {
    if (this.invalidLink() || this.store.isLoading() || this.store.completed()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.store.resetPassword(
      new ResetPasswordCommand({
        token: this.token(),
        newPassword: this.form.getRawValue().newPassword,
      }),
    );
  }
}
