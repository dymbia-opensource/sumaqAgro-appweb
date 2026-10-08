import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DemoSessionService } from '../../../application/demo-session.service';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { LayoutService } from '../layout/layout.service';
import { navigationFor } from './navigation-config';

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
  private readonly demoSession = inject(DemoSessionService);

  /** Side menu generated from the selected user's experience. */
  readonly sections = computed(() => {
    const user = this.demoSession.activeUser();
    return user ? navigationFor(user.experience) : [];
  });
}
