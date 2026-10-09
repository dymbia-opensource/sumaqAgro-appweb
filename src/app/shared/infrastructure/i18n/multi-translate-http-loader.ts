import { HttpClient } from '@angular/common/http';
import { mergeDeep, TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

/**
 * Loads the translations of one language from several files and merges them.
 *
 * @remarks
 * Each bounded context keeps its own file (`public/i18n/{lang}/{context}.json`),
 * so the teams do not edit the same translation file. A file that fails to
 * load is skipped, so the rest of the app is still translated.
 */
export class MultiTranslateHttpLoader implements TranslateLoader {
  /**
   * Creates the loader.
   * @param http - HttpClient used to download the files.
   * @param files - Names of the translation files, without the extension.
   * @param prefix - Folder of the translation files, served from `public/`.
   */
  constructor(
    private readonly http: HttpClient,
    private readonly files: readonly string[],
    private readonly prefix = '/i18n/',
  ) {}

  /**
   * Downloads every file of a language and merges them into one object.
   * @param lang - Language code (`es` or `en`).
   * @returns The translations of every bounded context.
   */
  getTranslation(lang: string): Observable<TranslationObject> {
    const requests = this.files.map((file) =>
      this.http.get<TranslationObject>(`${this.prefix}${lang}/${file}.json`).pipe(
        catchError(() => {
          console.error(`Translation file not found: ${this.prefix}${lang}/${file}.json`);
          return of({} as TranslationObject);
        }),
      ),
    );
    return forkJoin(requests).pipe(
      map((translations) =>
        translations.reduce<TranslationObject>(
          (merged, translation) => mergeDeep(merged, translation),
          {},
        ),
      ),
    );
  }
}
