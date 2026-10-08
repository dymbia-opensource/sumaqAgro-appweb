import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { ProfilesStore } from '../../../application/profiles.store';
import { DemoSessionService } from '../../../../shared/application/demo-session.service';

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
  private readonly demoSession = inject(DemoSessionService);
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  constructor() {
    const activeUser = this.demoSession.activeUser();

    if (activeUser?.experience === 'COOPERATIVE_DIRECTOR') {
      this.store.loadInstitutionalDashboard(activeUser.id);
    }
  }
}
