import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { CampaignStatus } from '../../domain/model/entities/campaign-status';
import { CropCampaign } from '../../domain/model/entities/crop-campaign.entity';
import { CropType } from '../../domain/model/entities/crop-type';
import { CropCampaignResource, CropCampaignsResponse } from '../responses/crop-campaign.response';

/** Maps crop campaigns between the RESTful API and the domain. */
export class CropCampaignAssembler implements BaseAssembler<
  CropCampaign,
  CropCampaignResource,
  CropCampaignsResponse
> {
  toEntityFromResource(resource: CropCampaignResource): CropCampaign {
    return new CropCampaign({
      id: resource.id,
      plotId: resource.plotId,
      season: resource.season,
      cropType: resource.cropType as CropType,
      seedVariety: resource.seedVariety,
      sowingDate: resource.sowingDate ? toLocalDate(resource.sowingDate) : null,
      status: resource.status as CampaignStatus,
    });
  }

  toResourceFromEntity(entity: CropCampaign): CropCampaignResource {
    return {
      id: entity.id as number,
      plotId: entity.plotId,
      season: entity.season,
      cropType: entity.cropType,
      seedVariety: entity.seedVariety,
      sowingDate: entity.sowingDate ? toIsoDate(entity.sowingDate) : null,
      status: entity.status,
    };
  }

  toEntitiesFromResponse(response: CropCampaignsResponse): CropCampaign[] {
    return response.campaigns.map((resource) => this.toEntityFromResource(resource));
  }
}

/** Reads a `YYYY-MM-DD` date as a local date (avoids the time zone shift). */
function toLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Writes a date as `YYYY-MM-DD`. */
function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
