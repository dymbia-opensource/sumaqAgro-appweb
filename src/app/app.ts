import { Component } from '@angular/core';
import { Layout } from './shared/presentation/components/layout/layout';

/** Root component: it only hosts the application shell. */
@Component({
  imports: [Layout],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
