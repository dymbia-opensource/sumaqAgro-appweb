import { Component, computed, inject, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LayoutService } from '../layout/layout.service';
import {IamStore} from '../../../../iam/application/iam.store';

/**
 * Top bar of the shell: menu button (on phones), search, connection status,
 * notifications and the user menu.
 */
@Component({
  selector: 'app-toolbar',
  imports: [
    RouterLink,
    MatBadgeModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
})
export class Toolbar {
  protected readonly layout = inject(LayoutService);
  private readonly iamStore = inject(IamStore);

  /** Account email shown until the profile provides a display name. */
  readonly userName = computed(() => this.iamStore.currentUser()?.email ?? '');
  /** Pending notifications. Connected to the agroclimatic alerts later. */
  readonly notificationCount = signal(0);
}
