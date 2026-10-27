import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IamStore } from '../../../application/iam.store';
import { SignInCommand } from '../../../domain/model/commands/sign-in.command';
import { AuthLayout } from '../../components/auth-layout/auth-layout';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrentSessionService } from '../../../application/current-session.service';
import { AuthNavigationService } from '../../../infrastructure/auth-navigation.service';

@Component({
  selector: 'app-sign-in-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,

    AuthLayout,
    TranslatePipe,
  ],
  templateUrl: './sign-in-form.html',
  styleUrl: './sign-in-form.css',
})
export class SignInForm {
  protected readonly store = inject(IamStore);
  protected readonly hidePassword = signal(true);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(CurrentSessionService);
  private readonly navigation = inject(AuthNavigationService);

  constructor() {
    this.store.clearFeedback();
    effect(() => {
      if (!this.session.hasActiveUser()) return;

      untracked(() => {
        const destination = this.navigation.destination(
          this.route.snapshot.queryParamMap.get('returnUrl'),
        );
        void this.router.navigateByUrl(destination, { replaceUrl: true });
      });
    });
  }
  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected togglePassword(): void {
    this.hidePassword.update((hidden) => !hidden);
  }

  protected submit(): void {
    if (this.store.isLoading()) return;

    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    this.store.signIn(new SignInCommand(this.form.getRawValue()));
  }
}
