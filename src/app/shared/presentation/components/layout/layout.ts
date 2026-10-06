import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, signal, viewChild } from '@angular/core';
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

/** One option of the side menu. */
export interface NavigationOption {
  /** Route of the option. */
  link: string;
  /** i18n key of the label. */
  label: string;
  /** Material Symbols icon name. */
  icon: string;
}

/** Group of options shown under a title in the side menu. */
export interface NavigationSection {
  /** i18n key of the section title. */
  title: string;
  options: NavigationOption[];
}

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

  /** Side menu options, grouped like in the Figma design. */
  readonly sections = signal<NavigationSection[]>([
    {
      title: 'section.major',
      options: [{ link: '/field-management/dashboard', label: 'option.my-plot', icon: 'home' }],
    },
    {
      title: 'section.agricultural-operation',
      options: [
        { link: '/crop-health/monitoring', label: 'option.crop-health', icon: 'eco' },
        { link: '/field-management/finances', label: 'option.expenses', icon: 'payments' },
        { link: '/crop-health/advisor', label: 'option.advisor', icon: 'forum' },
        {
          link: '/harvest-certification/certificates',
          label: 'option.harvest-certificates',
          icon: 'workspace_premium',
        },
      ],
    },
    {
      title: 'section.system',
      options: [
        { link: '/crop-health/alerts', label: 'option.alerts', icon: 'notification_important' },
        { link: '/profiles/settings', label: 'option.settings', icon: 'settings' },
      ],
    },
  ]);

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
