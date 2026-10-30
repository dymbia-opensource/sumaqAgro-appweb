import { BaseResource } from '../../../shared/infrastructure/base-response';

/** Plan of the catalog as the API sends it. */
export interface PlanResource extends BaseResource {
  id: number;
  code: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  /** ISO 4217 currency code, for example `PEN`. */
  currency: string;
  plotQuota: number;
  features: string[];
}
