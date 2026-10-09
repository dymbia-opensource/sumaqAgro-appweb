import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { TranslatePipe } from '@ngx-translate/core';
import { startWith } from 'rxjs';
import { CampaignLedger } from '../../../domain/model/entities/campaign-ledger.entity';
import { CropType } from '../../../domain/model/entities/crop-type';
import { YieldUnit } from '../../../domain/model/entities/yield-unit';

/** Seed varieties suggested for each crop; the producer can type another one (US-34). */
const SEED_VARIETIES: Record<CropType, string[]> = {
  [CropType.ANDEAN_POTATO]: ['Papa Canchán', 'Papa Yungay', 'Papa Perricholi', 'Papa Única'],
  [CropType.SPECIALTY_COFFEE]: ['Typica', 'Caturra', 'Bourbon', 'Geisha', 'Catimor'],
};

/** Data typed by the producer in the plot registration form. */
export interface PlotRegistrationData {
  name: string;
  region: string;
  cropType: CropType;
  seedVariety: string;
  /** `true` when the variety is not one of the suggested ones. */
  customVariety: boolean;
  sowingDate: Date;
  expectedYield: number | null;
  yieldUnit: YieldUnit;
  declaredAreaHectares: number;
}

/** Form with the data of the land and its crop; it validates and emits, the view saves. */
@Component({
  selector: 'app-plot-registration-form',
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    TranslatePipe,
  ],
  templateUrl: './plot-registration-form.html',
  styleUrl: './plot-registration-form.css',
})
export class PlotRegistrationForm {
  private fb = inject(FormBuilder);

  protected readonly cropTypes = Object.values(CropType);

  /** `true` while the plot is being saved. */
  readonly saving = input(false);

  /** The form is valid and the producer wants to continue. */
  readonly submitted = output<PlotRegistrationData>();

  /** The producer leaves without saving. */
  readonly cancel = output<void>();

  /**
   * Form group for the plot registration form.
   */
  form = this.fb.group({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    cropType: new FormControl<CropType>(CropType.ANDEAN_POTATO, { nonNullable: true }),
    seedVariety: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    region: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    sowingDate: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    expectedYield: new FormControl<number | null>(null, [Validators.min(1)]),
    declaredArea: new FormControl<number | null>(null, [Validators.min(0.01)]),
  });

  private readonly cropType = toSignal(
    this.form.controls.cropType.valueChanges.pipe(startWith(this.form.controls.cropType.value)),
    { requireSync: true },
  );

  private readonly varietyText = toSignal(
    this.form.controls.seedVariety.valueChanges.pipe(
      startWith(this.form.controls.seedVariety.value),
    ),
    { requireSync: true },
  );

  /** Varieties of the selected crop that match what the producer typed. */
  readonly varieties = computed(() => {
    const text = this.varietyText().toLowerCase();
    return SEED_VARIETIES[this.cropType()].filter((variety) =>
      variety.toLowerCase().includes(text),
    );
  });

  /** Unit of the expected yield: sacks for potato, quintals for coffee. */
  readonly yieldUnit = computed(() => CampaignLedger.yieldUnitOf(this.cropType()));

  /** Sends the data when the form is valid; otherwise shows the errors. */
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const [year, month, day] = value.sowingDate.split('-').map(Number);
    this.submitted.emit({
      name: value.name,
      region: value.region,
      cropType: value.cropType,
      seedVariety: value.seedVariety,
      customVariety: !SEED_VARIETIES[value.cropType].includes(value.seedVariety),
      sowingDate: new Date(year, month - 1, day),
      expectedYield: value.expectedYield,
      yieldUnit: this.yieldUnit(),
      declaredAreaHectares: value.declaredArea ?? 0,
    });
  }
}
