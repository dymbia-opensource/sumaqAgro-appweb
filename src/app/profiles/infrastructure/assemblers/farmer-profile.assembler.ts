import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { FarmerProfile } from '../../domain/model/entities/farmer-profile.entity';
import { FarmerProfileResource, FarmerProfilesResponse } from '../responses/farmer-profile.response';

/** Maps the Profiles API contract to the farmer profile domain entity. */
export class FarmerProfileAssembler
  implements BaseAssembler<FarmerProfile, FarmerProfileResource, FarmerProfilesResponse>
{
  toEntityFromResource(resource: FarmerProfileResource): FarmerProfile {
    return new FarmerProfile(resource);
  }

  toResourceFromEntity(entity: FarmerProfile): FarmerProfileResource {
    return {
      id: entity.id as number,
      userId: entity.userId,
      phoneNumber: entity.phoneNumber,
      email: entity.email,
    };
  }

  toEntitiesFromResponse(response: FarmerProfilesResponse): FarmerProfile[] {
    return response.profiles.map((profile) => this.toEntityFromResource(profile));
  }
}
