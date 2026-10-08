import { BaseResource } from '../../../shared/infrastructure/base-response';
import { NdviTrendPoint } from '../../domain/model/entities/cooperative-dashboard.entity';

/** Fake and production API contract for the institutional dashboard projection. */
export interface CooperativeDashboardResource extends BaseResource {
  id: number;
  directorUserId: number;
  cooperativeName: string;
  campaignName: string;
  activeMembers: number;
  monitoredHectares: number;
  collectionTons: number;
  collectionGoalTons: number;
  optimalPlotsPercentage: number;
  stressedPlotsPercentage: number;
  averageCostPerHectare: number;
  ndviTrend: NdviTrendPoint[];
  evaluatedLots: number;
  specialtyCoffeePercentage: number;
  firstGradePotatoPercentage: number;
  lossLotsPercentage: number;
}
