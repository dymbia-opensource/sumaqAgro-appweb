import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { Cooperative } from '../../domain/model/entities/cooperative.entity';
import { RegisterCooperativeCommand } from '../../domain/model/commands/register-cooperative.command';
import { CooperativeAssembler } from '../assemblers/cooperative.assembler';
import { CooperativeResource, CooperativesResponse } from '../responses/cooperative.response';

/** HTTP endpoint for institutional cooperative data. */
export class CooperativesApiEndpoint extends BaseApiEndpoint<
  Cooperative,
  CooperativeResource,
  CooperativesResponse,
  CooperativeAssembler
> {
  constructor(http: HttpClient) {
    super(http, `${environment.platformProviderApiBaseUrl}${environment.platformProviderCooperativesEndpointPath}`, new CooperativeAssembler());
  }

  getByDirector(userId: number): Observable<Cooperative | null> {
    const params = new HttpParams().set('directorUserId', userId);
    return this.http.get<CooperativeResource[]>(this.endpointUrl, { params }).pipe(
      map((cooperatives) => cooperatives[0] ? this.assembler.toEntityFromResource(cooperatives[0]) : null),
      catchError(this.handleError('Failed to fetch the cooperative')),
    );
  }

  /** Registers a cooperative and lets the API assign its identifier. */
  register(command: RegisterCooperativeCommand): Observable<Cooperative> {
    const resource = {
      directorUserId: command.directorUserId,
      legalName: command.legalName,
      region: command.region,
      institutionalEmail: command.institutionalEmail,
      legalRepresentative: command.legalRepresentative,
      ruc: command.ruc,
      headquartersAddress: command.headquartersAddress,
      switchboardPhone: command.switchboardPhone,
    };
    return this.http.post<CooperativeResource>(this.endpointUrl, resource).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to register the cooperative')),
    );
  }
}
