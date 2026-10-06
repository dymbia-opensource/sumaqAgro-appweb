import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import localeEsPe from '@angular/common/locales/es-PE';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';

/** Spanish (Peru) data for dates and numbers; English is built in. */
registerLocaleData(localeEsPe, 'es');

/**
 * Root application configuration.
 *
 * @remarks
 * Registers the router, the HTTP client used by the infrastructure endpoints,
 * ngx-translate (it loads `public/i18n/{lang}.json`) and the Material Symbols
 * icon font for `<mat-icon>`.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
      fallbackLang: 'es',
      lang: 'es',
    }),
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),
  ],
};
