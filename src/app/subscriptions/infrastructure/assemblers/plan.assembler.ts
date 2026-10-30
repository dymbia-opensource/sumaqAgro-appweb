import { Money } from '../../../shared/domain/model/money';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { PlanCode } from '../../domain/model/entities/plan-code';
import { Plan } from '../../domain/model/entities/plan.entity';
import { PlanResource } from '../responses/plan.response';
import { PlansResponse } from '../responses/plans.response';

/** Maps plan entities to and from API resources. */
export class PlanAssembler implements BaseAssembler<Plan, PlanResource, PlansResponse> {
  toEntitiesFromResponse = (response: PlansResponse): Plan[] =>
    response.plans.map((resource) => this.toEntityFromResource(resource));

  toEntityFromResource = (resource: PlanResource): Plan =>
    new Plan({
      id: resource.id,
      code: resource.code as PlanCode,
      name: resource.name,
      monthlyPrice: new Money(resource.monthlyPrice, resource.currency),
      annualPrice: new Money(resource.annualPrice, resource.currency),
      plotQuota: resource.plotQuota,
      features: resource.features,
    });

  toResourceFromEntity = (entity: Plan): PlanResource => ({
    id: entity.id as number,
    code: entity.code,
    name: entity.name,
    monthlyPrice: entity.monthlyPrice.amount,
    annualPrice: entity.annualPrice.amount,
    currency: entity.monthlyPrice.currency,
    plotQuota: entity.plotQuota,
    features: entity.features,
  });
}
