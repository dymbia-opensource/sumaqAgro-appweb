import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root component.
 *
 * @remarks
 * It only hosts the router: the private pages are shown inside the shell
 * (`Layout`), and the demo access and the public QR verification without it.
 */
@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
