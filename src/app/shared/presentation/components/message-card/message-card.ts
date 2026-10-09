import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/**
 * Card with an icon and a short message: errors, empty lists or limits.
 *
 * @remarks
 * Buttons go inside a `<mat-card-actions>` placed between the tags.
 */
@Component({
  selector: 'app-message-card',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './message-card.html',
  styleUrl: './message-card.css',
})
export class MessageCard {
  /** Material icon shown before the message. */
  readonly icon = input('info');

  /** Message, already translated. */
  readonly message = input.required<string>();

  /** `true` for errors, so screen readers announce the message. */
  readonly alert = input(false);
}
