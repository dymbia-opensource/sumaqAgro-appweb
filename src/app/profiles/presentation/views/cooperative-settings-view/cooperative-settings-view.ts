import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { ProfilesStore } from '../../../application/profiles.store';

/** Institutional configuration details for the cooperative director. */
@Component({
  selector: 'app-cooperative-settings-view',
  imports: [MatCardModule, MatIconModule, MatProgressBarModule, TranslatePipe],
  templateUrl: './cooperative-settings-view.html',
  styleUrl: './cooperative-settings-view.css',
})
export class CooperativeSettingsView {
  private readonly store = inject(ProfilesStore);
  readonly cooperative = this.store.cooperative;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  constructor() {
    this.store.loadInstitutionalDashboard(environment.demoUserId);
  }
}
