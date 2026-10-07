import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Pest / Disease Report Form View.
 *
 * @remarks
 * Provides a reactive form for a producer to describe observed symptoms,
 * choose a severity level, and optionally attach a photo URL.
 * On submission the payload is logged and will be dispatched to the
 * Application Layer command bus once the backend is connected.
 */
@Component({
  selector: 'app-pest-report-form',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './pest-report-form.html',
  styleUrl: './pest-report-form.css',
})
export class PestReportForm {
  /** Non-nullable form builder — modern Angular DI pattern without constructor. */
  private readonly fb = inject(NonNullableFormBuilder);

  /** Reactive form group with description, severity and optional photo URL. */
  readonly reportForm = this.fb.group({
    description: ['', [Validators.required, Validators.minLength(10)]],
    severity:    ['LOW' as const, Validators.required],
    photoUrl:    [''],
  });

  /**
   * Handles form submission.
   * Logs the command payload; actual API call will be wired in a future sprint.
   */
  onSubmit(): void {
    if (this.reportForm.valid) {
      console.log('Dispatching CreatePestReportCommand:', this.reportForm.getRawValue());
      this.reportForm.reset();
    }
  }
}
