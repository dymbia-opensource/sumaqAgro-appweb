import { Component, inject } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { LeftSidebar } from '../left-sidebar/left-sidebar';
import { Toolbar } from '../toolbar/toolbar';
import { LayoutService } from './layout.service';

/**
 * Shell of the private pages: side menu, top bar and the routed content.
 *
 * @remarks
 * It is the parent route of every bounded context. The pages without menu
 * (demo access and the public QR verification) are outside of it.
 */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, MatSidenavModule, LeftSidebar, Toolbar],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  protected readonly layout = inject(LayoutService);
}
