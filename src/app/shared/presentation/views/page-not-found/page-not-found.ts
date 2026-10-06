import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/** View shown when the user opens a route that does not exist. */
@Component({
  selector: 'app-page-not-found',
  imports: [MatCardModule, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './page-not-found.html',
  styleUrl: './page-not-found.css',
})
export class PageNotFound {
  private readonly router = inject(Router);

  /** Path that was not found. */
  readonly invalidPath = this.router.url;

  /** Goes back to the start page of the app. */
  navigateToHome(): void {
    this.router.navigate(['/']);
  }
}
