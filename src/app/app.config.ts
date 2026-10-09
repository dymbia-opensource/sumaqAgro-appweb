import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import localeEsPe from '@angular/common/locales/es-PE';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { routes } from './app.routes';
import { MultiTranslateHttpLoader } from './shared/infrastructure/i18n/multi-translate-http-loader';
import { TranslatedPaginatorIntl } from './shared/presentation/i18n/translated-paginator-intl';

/** Spanish (Peru) data for dates and numbers; English is built in. */
registerLocaleData(localeEsPe, 'es');

/**
 * Translation files of `public/i18n/{lang}/`: one for `shared` and one per bounded context.
 * A new bounded context adds its file here.
 */
const TRANSLATION_FILES = [
  'shared',
  'field-management',
  'crop-health',
  'profiles',
  'harvest-certification',
];

/**
 * Root application configuration.
 *
 * @remarks
 * Registers the router, the HTTP client used by the infrastructure endpoints,
 * ngx-translate (it loads the translation file of each bounded context), the
 * translated texts of the Material paginator and the Material Symbols icon
 * font for `<mat-icon>`.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideTranslateService({
      loader: provideTranslateLoader(
        () => new MultiTranslateHttpLoader(inject(HttpClient), TRANSLATION_FILES),
      ),
      fallbackLang: 'en',
      lang: 'en',
    }),
    { provide: MatPaginatorIntl, useClass: TranslatedPaginatorIntl },
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),
  ],
};
