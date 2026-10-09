import { Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { CropHealthStore } from '../../../application/crop-health.store';
@Component({
  selector: 'app-crop-plot-selector',
  imports: [MatFormFieldModule, MatSelectModule, TranslatePipe],
  template: `<mat-form-field appearance="outline">
    <mat-label>{{ 'crop-health.change-plot' | translate }}</mat-label>
    <mat-select [value]="store.selectedPlot()?.id" (selectionChange)="store.selectPlot($event.value)" [disabled]="store.scopeLoading()">
      @for (plot of store.plots(); track plot.id) { <mat-option [value]="plot.id">{{ plot.name }}</mat-option> }
    </mat-select>
  </mat-form-field>`,
})
export class CropPlotSelector { readonly store = inject(CropHealthStore); }
