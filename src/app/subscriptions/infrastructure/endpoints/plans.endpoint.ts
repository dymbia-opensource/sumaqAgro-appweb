import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { Plan } from '../../domain/model/entities/plan.entity';
import { PlanAssembler } from '../assemblers/plan.assembler';
import { PlanResource } from '../responses/plan.response';
import { PlansResponse } from '../responses/plans.response';

/** HTTP endpoint for the plan catalog (`/plans`). */
export class PlansApiEndpoint extends BaseApiEndpoint<
  Plan,
  PlanResource,
  PlansResponse,
  PlanAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderPlansEndpointPath}`,
      new PlanAssembler(),
    );
  }
}
