import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { Subscription } from '../../domain/model/entities/subscription.entity';
import { SubscriptionAssembler } from '../assemblers/subscription.assembler';
import { SubscriptionResource, SubscriptionsResponse } from '../responses/subscription.response';

/** HTTP endpoint for the subscriptions resource (`/subscriptions`). */
export class SubscriptionsApiEndpoint extends BaseApiEndpoint<
  Subscription,
  SubscriptionResource,
  SubscriptionsResponse,
  SubscriptionAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderSubscriptionsEndpointPath}`,
      new SubscriptionAssembler(),
    );
  }

  /**
   * Loads the subscription of one user. Each user has only one.
   * @param userId - Owner of the subscription.
   * @returns The subscription, or `null` if the user has none yet.
   */
  getByUser(userId: number): Observable<Subscription | null> {
    return this.getAllBy({ userId }, 'Failed to fetch the subscription of the user').pipe(
      map((subscriptions) => subscriptions[0] ?? null),
    );
  }
}
