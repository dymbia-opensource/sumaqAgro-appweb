import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { HarvestCropType } from '../../../domain/model/entities/crop-type';
import { HarvestEvaluationForm } from '../harvest-batch-registration-view/harvest-batch-registration-view';

@Component({
  selector: 'app-harvest-grading-sheet-view',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './harvest-grading-sheet-view.html',
  styleUrl: './harvest-grading-sheet-view.css',
})
/** Muestra los campos de calificación según el cultivo de la parcela. */
export class HarvestGradingSheetView {
  @Input({ required: true }) form!: HarvestEvaluationForm;
  @Input({ required: true }) cropType!: HarvestCropType;

  /** La suma de calibres se usa para avisar si la calificación de papa es válida. */
  get gradingTotal(): number {
    return this.form.firstPercentage + this.form.secondPercentage + this.form.thirdPercentage;
  }
}
