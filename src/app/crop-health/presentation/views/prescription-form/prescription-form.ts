import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Prescription Form View (Agronomist).
 *
 * @remarks
 * Form for an agronomist to issue a technical prescription, including
 * agrochemical selection, dosage, and application instructions.
 */
@Component({
  selector: 'app-prescription-form',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './prescription-form.html',
  styleUrl: './prescription-form.css',
})
export class PrescriptionForm {
  /** Reactive form builder via injection. */
  private readonly fb = inject(NonNullableFormBuilder);

  /** Form model for the prescription. */
  readonly prescriptionForm = this.fb.group({
    agrochemical: ['', Validators.required],
    dosage:       ['', Validators.required],
    instructions: ['', Validators.required],
  });

  /** Handles the submission of the prescription. */
  onSubmit(): void {
    if (this.prescriptionForm.valid) {
      console.log('Dispatching IssuePrescriptionCommand:', this.prescriptionForm.getRawValue());
      this.prescriptionForm.reset();
    }
  }
}
