import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { CooperativeMember } from '../domain/model/entities/cooperative-member.entity';
import { Cooperative } from '../domain/model/entities/cooperative.entity';
import { CooperativeDashboard } from '../domain/model/entities/cooperative-dashboard.entity';
import { FarmerProfile } from '../domain/model/entities/farmer-profile.entity';
import { RegisterCooperativeCommand } from '../domain/model/commands/register-cooperative.command';
import { CooperativeMembersApiEndpoint } from './endpoints/cooperative-members.endpoint';
import { CooperativeDashboardApiEndpoint } from './endpoints/cooperative-dashboard.endpoint';
import { CooperativesApiEndpoint } from './endpoints/cooperatives.endpoint';
import { FarmerProfilesApiEndpoint } from './endpoints/farmer-profiles.endpoint';

/** Facade that exposes only the Profile data required by its application layer. */
@Service()
export class ProfilesApi extends BaseApi {
  private readonly farmerProfilesEndpoint: FarmerProfilesApiEndpoint;
  private readonly cooperativesEndpoint: CooperativesApiEndpoint;
  private readonly cooperativeMembersEndpoint: CooperativeMembersApiEndpoint;
  private readonly cooperativeDashboardEndpoint: CooperativeDashboardApiEndpoint;

  constructor() {
    super();
    const http = inject(HttpClient);
    this.farmerProfilesEndpoint = new FarmerProfilesApiEndpoint(http);
    this.cooperativesEndpoint = new CooperativesApiEndpoint(http);
    this.cooperativeMembersEndpoint = new CooperativeMembersApiEndpoint(http);
    this.cooperativeDashboardEndpoint = new CooperativeDashboardApiEndpoint(http);
  }

  getFarmerProfile(userId: number): Observable<FarmerProfile> {
    return this.farmerProfilesEndpoint.getByUser(userId);
  }

  updateFarmerProfile(profile: FarmerProfile): Observable<FarmerProfile> {
    return this.farmerProfilesEndpoint.update(profile, profile.id);
  }

  getCooperativeByDirector(userId: number): Observable<Cooperative | null> {
    return this.cooperativesEndpoint.getByDirector(userId);
  }

  getCooperativeMembers(cooperativeId: number): Observable<CooperativeMember[]> {
    return this.cooperativeMembersEndpoint.getByCooperative(cooperativeId);
  }

  getInstitutionalDashboard(directorUserId: number): Observable<CooperativeDashboard | null> {
    return this.cooperativeDashboardEndpoint.getByDirector(directorUserId);
  }

  registerCooperative(command: RegisterCooperativeCommand): Observable<Cooperative> {
    return this.cooperativesEndpoint.register(command);
  }
}
