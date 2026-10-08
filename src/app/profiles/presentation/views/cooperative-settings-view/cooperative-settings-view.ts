import { Component, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DemoSessionService } from '../../../../shared/application/demo-session.service';
import { ProfilesStore } from '../../../application/profiles.store';
import { UpdateCooperativeCommand } from '../../../domain/model/commands/update-cooperative.command';

/** Institutional configuration details for the cooperative director. */
@Component({
  selector: 'app-cooperative-settings-view',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './cooperative-settings-view.html',
  styleUrl: './cooperative-settings-view.css',
})
export class CooperativeSettingsView {
  private readonly store = inject(ProfilesStore);
  readonly cooperative = this.store.cooperative;
  private readonly demoSession = inject(DemoSessionService);
  readonly loading = this.store.loading;
  readonly saving = this.store.saving;
  readonly error = this.store.error;
  readonly form = new FormGroup({
    legalName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    ruc: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{11}$/)] }),
    region: new FormControl('', { nonNullable: true, validators: Validators.required }),
    headquartersAddress: new FormControl('', { nonNullable: true, validators: Validators.required }),
    institutionalEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    switchboardPhone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(7)] }),
    legalRepresentative: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });

  constructor() {
    const activeUser = this.demoSession.activeUser();

    if (activeUser?.experience === 'COOPERATIVE_DIRECTOR') {
      this.store.loadInstitutionalDashboard(activeUser.id);
    }

    effect(() => {
      const cooperative = this.cooperative();
      if (!cooperative) return;

      this.form.setValue({
        legalName: cooperative.legalName,
        ruc: cooperative.ruc,
        region: cooperative.region,
        headquartersAddress: cooperative.headquartersAddress,
        institutionalEmail: cooperative.institutionalEmail,
        switchboardPhone: cooperative.switchboardPhone,
        legalRepresentative: cooperative.legalRepresentative,
      }, { emitEvent: false });
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.store.saveCooperative(new UpdateCooperativeCommand(this.form.getRawValue()));
  }
}
