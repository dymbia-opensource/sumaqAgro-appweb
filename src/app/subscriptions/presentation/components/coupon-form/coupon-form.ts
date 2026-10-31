import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

/** Validates a promotional code and emits it to the checkout view. */
@Component({
  selector: 'app-coupon-form',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './coupon-form.html',
  styleUrl: './coupon-form.css',
})
export class CouponForm {
  /** Prevents applying a code while checkout is processing. */
  readonly disabled = input(false);

  /** The user wants to validate this promotional code. */
  readonly apply = output<string>();

  protected readonly couponCode = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  protected onSubmit(): void {
    if (this.couponCode.invalid || this.disabled()) {
      this.couponCode.markAsTouched();
      return;
    }
    this.apply.emit(this.couponCode.value.trim());
  }
}
