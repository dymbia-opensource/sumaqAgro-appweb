import { inject, Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { startWith } from 'rxjs';

/**
 * Texts of the Angular Material paginator in the language of the app.
 *
 * @remarks
 * Every table of every bounded context uses it ("Elementos por página",
 * "1 – 10 de 25"...). The texts are in `public/i18n/{lang}/shared.json`.
 */
@Injectable()
export class TranslatedPaginatorIntl extends MatPaginatorIntl {
  private readonly translate = inject(TranslateService);

  constructor() {
    super();
    this.translate.onLangChange.pipe(startWith(null)).subscribe(() => this.updateLabels());
  }

  /**
   * Text of the shown range, for example `11 – 20 de 25`.
   * @param page - Index of the page, from 0.
   * @param pageSize - Rows per page.
   * @param length - Total number of rows.
   */
  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return this.translate.instant('paginator.range-empty', { length });
    }
    const start = page * pageSize + 1;
    const end = Math.min(start + pageSize - 1, length);
    return this.translate.instant('paginator.range', { start, end, length });
  };

  /** Reads the labels again and tells the paginators to repaint. */
  private updateLabels(): void {
    this.itemsPerPageLabel = this.translate.instant('paginator.items-per-page');
    this.nextPageLabel = this.translate.instant('paginator.next-page');
    this.previousPageLabel = this.translate.instant('paginator.previous-page');
    this.firstPageLabel = this.translate.instant('paginator.first-page');
    this.lastPageLabel = this.translate.instant('paginator.last-page');
    this.changes.next();
  }
}
