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
import {IamStore} from '../../../../iam/application/iam.store';

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
  private readonly iamStore = inject(IamStore);

  /** Navigation generated from the authenticated account's roles. */
  readonly sections = computed(() => {
    const user = this.iamStore.currentUser();

    if (!user) return [];

    const role =
      user.roles.find((candidate) => candidate === 'COOPERATIVE_DIRECTOR') ??
      user.roles.find((candidate) => candidate === 'AGRONOMIST') ??
      user.roles.find((candidate) => candidate === 'FARMER');

    return role ? navigationFor(role) : [];
  });
}
