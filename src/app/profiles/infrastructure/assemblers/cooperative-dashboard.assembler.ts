import { CooperativeDashboard } from '../../domain/model/entities/cooperative-dashboard.entity';
import { CooperativeDashboardResource } from '../responses/cooperative-dashboard.response';

/** Maps the dashboard projection API contract to its read model. */
export class CooperativeDashboardAssembler {
  toEntity(resource: CooperativeDashboardResource): CooperativeDashboard {
    return new CooperativeDashboard(resource);
  }
}
