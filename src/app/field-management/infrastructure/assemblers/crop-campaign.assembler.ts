import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { fromApiDate, toApiDate } from '../../../shared/infrastructure/api-date';
import { CampaignStatus } from '../../domain/model/entities/campaign-status';
import { CropCampaign } from '../../domain/model/entities/crop-campaign.entity';
import { CropType } from '../../domain/model/entities/crop-type';
import { CropCampaignResource } from '../responses/crop-campaign.response';
import { CropCampaignsResponse } from '../responses/crop-campaigns.response';

/**
 * Maps crop campaign entities to and from API resources.
 */
export class CropCampaignAssembler implements BaseAssembler<
  CropCampaign,
  CropCampaignResource,
  CropCampaignsResponse
> {
  /**
   * Converts a CropCampaignsResponse to an array of CropCampaign entities.
   * @param response - The API response containing campaigns.
   * @returns An array of CropCampaign entities.
   */
  toEntitiesFromResponse = (response: CropCampaignsResponse): CropCampaign[] =>
    response.campaigns.map((resource) => this.toEntityFromResource(resource));

  /**
   * Converts a CropCampaignResource to a CropCampaign entity.
   * @param resource - The resource to convert.
   * @returns The converted CropCampaign entity.
   */
  toEntityFromResource = (resource: CropCampaignResource): CropCampaign =>
    new CropCampaign({
      id: resource.id,
      clientSyncId: resource.clientSyncId,
      plotId: resource.plotId,
      season: resource.season,
      cropType: resource.cropType as CropType,
      seedVariety: resource.seedVariety,
      customSeedVariety: resource.seedVarietyCustom ?? false,
      sowingDate: resource.sowingDate ? fromApiDate(resource.sowingDate) : null,
      status: resource.status as CampaignStatus,
    });

  /**
   * Converts a CropCampaign entity to a CropCampaignResource.
   * @param entity - The entity to convert.
   * @returns The converted CropCampaignResource.
   */
  toResourceFromEntity = (entity: CropCampaign): CropCampaignResource => ({
    id: entity.id as number,
    clientSyncId: entity.clientSyncId || undefined,
    plotId: entity.plotId,
    season: entity.season,
    cropType: entity.cropType,
    seedVariety: entity.seedVariety,
    seedVarietyCustom: entity.customSeedVariety,
    sowingDate: entity.sowingDate ? toApiDate(entity.sowingDate) : null,
    status: entity.status,
  });
}
