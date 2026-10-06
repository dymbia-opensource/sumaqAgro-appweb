import { UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

const STORAGE_KEY = 'sumaqagro.language';

/**
 * Segmented ES | EN control that changes the language of the whole app.
 *
 * @remarks
 * The chosen language is remembered in the browser for the next visit.
 */
@Component({
  selector: 'app-language-switcher',
  imports: [MatButtonToggleModule, MatIconModule, MatTooltipModule, TranslatePipe, UpperCasePipe],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css',
})
export class LanguageSwitcher {
  private readonly translate = inject(TranslateService);

  /** Languages offered to the user. */
  readonly languages: string[] = ['es', 'en'];

  /** Language currently in use (reactive). */
  readonly currentLang = this.translate.currentLang;

  constructor() {
    this.translate.addLangs(this.languages);
    const saved = this.readSavedLanguage();
    if (saved && saved !== this.translate.getCurrentLang()) {
      this.translate.use(saved);
    }
  }

  /**
   * Changes the language of the app and remembers it.
   * @param language - Language code (`es` or `en`).
   */
  useLanguage(language: string): void {
    this.translate.use(language);
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Storage may be blocked (private mode); the language still changes.
    }
  }

  private readSavedLanguage(): string | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && this.languages.includes(saved) ? saved : null;
    } catch {
      return null;
    }
  }
}
