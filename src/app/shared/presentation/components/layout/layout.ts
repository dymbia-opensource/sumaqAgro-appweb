import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { fromEvent, map, merge } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { navigationFor, UserExperience } from './navigation-config';

/**
 * Main shell of the app: side menu, top bar and the routed content.
 *
 * @remarks
 * On wide screens the menu stays open; on phones it opens over the content
 * from the menu button.
 */
@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    TranslatePipe,
    LanguageSwitcher,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private readonly router = inject(Router);
  private readonly sidenav = viewChild.required<MatSidenav>('sidenav');

  /** `true` on phones and small tablets. */
  readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959.98px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  /** `true` while the browser has network connection. */
  readonly isOnline = toSignal(
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false)),
    ),
    { initialValue: navigator.onLine },
  );

  /** Temporary role switch until IAM provides the authenticated user's role. */
  readonly userExperience = signal<UserExperience>(environment.demoUserExperience);

  /** Side menu options corresponding to the active user experience. */
  readonly sections = computed(() => navigationFor(this.userExperience()));

  /** Name shown in the user menu. Replaced by the signed-in user in the IAM phase. */
  readonly userName = signal(environment.demoUserName);

  /** Pending notifications. Connected to the agroclimatic alerts later. */
  readonly notificationCount = signal(0);

  /** Opens or closes the side menu. */
  toggleSidebar(): void {
    this.sidenav().toggle();
  }

  /** Closes the menu after choosing an option, only on phones. */
  closeOnHandset(): void {
    if (this.isHandset()) {
      this.sidenav().close();
    }
  }

  /** Signs the user out. It will call the IAM store once IAM is implemented. */
  signOut(): void {
    this.closeOnHandset();
    this.router.navigate(['/']);
  }
}
