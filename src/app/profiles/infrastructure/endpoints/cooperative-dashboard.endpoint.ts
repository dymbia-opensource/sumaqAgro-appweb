import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../../shared/infrastructure/error-handling-enabled-base-type';
import { CooperativeDashboard } from '../../domain/model/entities/cooperative-dashboard.entity';
import { CooperativeDashboardAssembler } from '../assemblers/cooperative-dashboard.assembler';
import { CooperativeDashboardResource } from '../responses/cooperative-dashboard.response';

/** HTTP endpoint for the cooperative director dashboard projection. */
export class CooperativeDashboardApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly endpointUrl = `${environment.platformProviderApiBaseUrl}/cooperative-dashboards`;
  private readonly assembler = new CooperativeDashboardAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  getByDirector(directorUserId: number): Observable<CooperativeDashboard | null> {
    const params = new HttpParams().set('directorUserId', directorUserId);
    return this.http.get<CooperativeDashboardResource[]>(this.endpointUrl, { params }).pipe(
      map((dashboards) => (dashboards[0] ? this.assembler.toEntity(dashboards[0]) : null)),
      catchError(this.handleError('Failed to fetch the institutional dashboard')),
    );
  }
}
