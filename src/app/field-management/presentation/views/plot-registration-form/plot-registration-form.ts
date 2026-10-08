import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { startWith } from 'rxjs';
import { FieldManagementStore } from '../../../application/field-management.store';
import { RecordSowingDateCommand } from '../../../domain/model/commands/record-sowing-date.command';
import { RegisterFieldPlotCommand } from '../../../domain/model/commands/register-field-plot.command';
import { SelectCropTypeCommand } from '../../../domain/model/commands/select-crop-type.command';
import { SetExpectedYieldCommand } from '../../../domain/model/commands/set-expected-yield.command';
import { SpecifySeedVarietyCommand } from '../../../domain/model/commands/specify-seed-variety.command';
import { StartCropCampaignCommand } from '../../../domain/model/commands/start-crop-campaign.command';
import { CampaignLedger } from '../../../domain/model/entities/campaign-ledger.entity';
import { CropCampaign } from '../../../domain/model/entities/crop-campaign.entity';
import { CropType } from '../../../domain/model/entities/crop-type';

/** Seed varieties suggested for each crop; the producer can type another one (US-34). */
const SEED_VARIETIES: Record<CropType, string[]> = {
  [CropType.ANDEAN_POTATO]: ['Papa Canchán', 'Papa Yungay', 'Papa Perricholi', 'Papa Única'],
  [CropType.SPECIALTY_COFFEE]: ['Typica', 'Caturra', 'Bourbon', 'Geisha', 'Catimor'],
};

/**
 * Step 1 of 2 of the plot registration: general data of the land and its crop.
 *
 * @remarks
 * It registers the plot "without polygon" (US-28) with its first campaign:
 * crop, variety, sowing date (US-32 to US-34) and the optional expected yield
 * (US-40). Then it opens step 2 to mark the polygon on the map.
 */
@Component({
  selector: 'app-plot-registration-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatRadioModule,
    TranslatePipe,
  ],
  templateUrl: './plot-registration-form.html',
  styleUrl: './plot-registration-form.css',
})
export class PlotRegistrationForm {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private fieldManagementStore = inject(FieldManagementStore);

  protected readonly cropTypes = Object.values(CropType);

  readonly loading = this.fieldManagementStore.loading;
  readonly error = this.fieldManagementStore.error;
  readonly canRegisterPlot = this.fieldManagementStore.canRegisterPlot;
  readonly plotQuota = this.fieldManagementStore.plotQuota;

  /** Number of the slot the new plot will use. */
  readonly slotNumber = computed(() => this.fieldManagementStore.plotCount() + 1);

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

  /**
   * Registers the plot with its first campaign and continues to step 2 (the map).
   */
  onNext() {
    const ownerUserId = this.fieldManagementStore.currentUserId();
    if (this.form.invalid || ownerUserId === null) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const [year, month, day] = value.sowingDate.split('-').map(Number);
    const sowingDate = new Date(year, month - 1, day);

    const command = new RegisterFieldPlotCommand({
      ownerUserId,
      name: value.name,
      region: value.region,
      declaredAreaHectares: value.declaredArea ?? 0,
    });

    this.fieldManagementStore.registerPlot(
      command,
      {
        start: new StartCropCampaignCommand({ plotId: 0, season: CropCampaign.seasonOf(sowingDate) }),
        cropType: new SelectCropTypeCommand({ campaignId: 0, cropType: value.cropType }),
        seedVariety: new SpecifySeedVarietyCommand({
          campaignId: 0,
          varietyName: value.seedVariety,
          custom: !SEED_VARIETIES[value.cropType].includes(value.seedVariety),
        }),
        sowingDate: new RecordSowingDateCommand({ campaignId: 0, sowingDate }),
        expectedYield: value.expectedYield
          ? new SetExpectedYieldCommand({
              ledgerId: 0,
              expectedYield: value.expectedYield,
              unit: this.yieldUnit(),
            })
          : undefined,
      },
      (plot) => this.router.navigate(['field-management/plots', plot.id, 'boundary']).then(),
    );
  }

  /** Goes back to the plot list without saving. */
  onCancel() {
    this.router.navigate(['field-management/plots']).then();
  }
}
