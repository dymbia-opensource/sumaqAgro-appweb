import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/** One step of the breadcrumb: an i18n key and, optionally, the route it opens. */
export interface Breadcrumb {
  label: string;
  link?: string;
}

/**
 * Header of a page: breadcrumb, title and subtitle.
 *
 * @remarks
 * The last breadcrumb is the current page. Buttons placed between the tags
 * (for example a "View all" link) are shown at the right of the title.
 */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink, MatIconModule, TranslatePipe],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class PageHeader {
  /** Path from the start page to the current page. */
  readonly breadcrumbs = input<Breadcrumb[]>([]);

  /** Title of the page, already translated. */
  readonly title = input.required<string>();

  /** Text under the title, already translated. */
  readonly subtitle = input<string>();

  /** Smaller title, for pages with a long title. */
  readonly compact = input(false);
}
