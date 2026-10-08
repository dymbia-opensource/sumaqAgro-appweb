import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { FarmerProfile } from '../domain/model/entities/farmer-profile.entity';
import { FarmerProfilesApiEndpoint } from './endpoints/farmer-profiles.endpoint';

/** Facade through which the Profiles application layer accesses its API. */
@Service()
export class ProfilesApi extends BaseApi {
  private readonly farmerProfilesEndpoint: FarmerProfilesApiEndpoint;

  constructor() {
    super();
    this.farmerProfilesEndpoint = new FarmerProfilesApiEndpoint(inject(HttpClient));
  }

  getFarmerProfile(userId: number): Observable<FarmerProfile> {
    return this.farmerProfilesEndpoint.getByUser(userId);
  }

  updateFarmerProfile(profile: FarmerProfile): Observable<FarmerProfile> {
    return this.farmerProfilesEndpoint.update(profile, profile.id);
  }
}
