import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PasswordRecoveryStore } from '../../../application/password-recovery.store';
import { RequestPasswordResetCommand } from '../../../domain/model/commands/request-password-reset.command';
import { AuthLayout } from '../../components/auth-layout/auth-layout';

@Component({
  selector: 'app-forgot-password-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
    TranslatePipe,
    AuthLayout,
  ],
  providers: [PasswordRecoveryStore],
  templateUrl: './forgot-password-form.html',
  styleUrl: './forgot-password-form.css',
})
export class ForgotPasswordForm {
  protected readonly store = inject(PasswordRecoveryStore);
  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected submit(): void {
    if (this.store.isLoading() || this.store.completed()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.store.requestReset(new RequestPasswordResetCommand(this.form.getRawValue()));
  }
}
