import { BaseResponse } from '../../../shared/infrastructure/base-response';
import { CampaignLedgerResource } from './campaign-ledger.response';

/**
 * Response envelope for cost ledger collection queries.
 */
export interface CampaignLedgersResponse extends BaseResponse {
  /** Cost ledger resources included in the response. */
  ledgers: CampaignLedgerResource[];
}
