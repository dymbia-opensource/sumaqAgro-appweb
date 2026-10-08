import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { FieldPlot } from '../../domain/model/entities/field-plot.entity';
import { FieldPlotAssembler } from '../assemblers/field-plot.assembler';
import { FieldPlotResource } from '../responses/field-plot.response';
import { FieldPlotsResponse } from '../responses/field-plots.response';

/** HTTP endpoint for the field plots resource (`/field-plots`). */
export class FieldPlotsApiEndpoint extends BaseApiEndpoint<
  FieldPlot,
  FieldPlotResource,
  FieldPlotsResponse,
  FieldPlotAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderFieldPlotsEndpointPath}`,
      new FieldPlotAssembler(),
    );
  }

  /**
   * Loads the plots of one producer.
   * @param ownerUserId - Producer who owns the plots.
   */
  getByOwner(ownerUserId: number): Observable<FieldPlot[]> {
    return this.getAllBy({ ownerUserId }, 'Failed to fetch the plots of the producer');
  }
}
