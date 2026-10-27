import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { LayoutService } from '../layout/layout.service';
import { navigationFor } from './navigation-config';
import { CurrentSessionService } from '../../../../iam/application/current-session.service';

/**
 * Side menu of the shell: brand, options of the user's role, offline status,
 * language and sign out.
 */
@Component({
  selector: 'app-left-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    TranslatePipe,
    LanguageSwitcher,
  ],
  templateUrl: './left-sidebar.html',
  styleUrl: './left-sidebar.css',
})
export class LeftSidebar {
  protected readonly layout = inject(LayoutService);
  private readonly session = inject(CurrentSessionService);

  /** Navigation generated from the current participant's primary role. */
  readonly sections = computed(() => {
    const user = this.session.activeUser();

    return user ? navigationFor(user.experience) : [];
  });
}
