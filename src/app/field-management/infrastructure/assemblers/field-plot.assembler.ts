import { fromApiDate, toApiDate } from '../../../shared/infrastructure/api-date';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { FieldPlot } from '../../domain/model/entities/field-plot.entity';
import { GeoCoordinate } from '../../domain/model/entities/geo-coordinate';
import { PlotStatus } from '../../domain/model/entities/plot-status';
import { SoilBaseline } from '../../domain/model/entities/soil-baseline';
import { SoilTexture } from '../../domain/model/entities/soil-texture';
import { FieldPlotResource } from '../responses/field-plot.response';
import { FieldPlotsResponse } from '../responses/field-plots.response';
import { SoilBaselineResource } from '../responses/soil-baseline.response';

/**
 * Maps field plot entities to and from API resources.
 */
export class FieldPlotAssembler implements BaseAssembler<
  FieldPlot,
  FieldPlotResource,
  FieldPlotsResponse
> {
  /**
   * Converts a FieldPlotsResponse to an array of FieldPlot entities.
   * @param response - The API response containing plots.
   * @returns An array of FieldPlot entities.
   */
  toEntitiesFromResponse = (response: FieldPlotsResponse): FieldPlot[] =>
    response.plots.map((resource) => this.toEntityFromResource(resource));

  /**
   * Converts a FieldPlotResource to a FieldPlot entity.
   * @param resource - The resource to convert.
   * @returns The converted FieldPlot entity.
   */
  toEntityFromResource = (resource: FieldPlotResource): FieldPlot =>
    new FieldPlot({
      id: resource.id,
      ownerUserId: resource.ownerUserId,
      name: resource.name,
      region: resource.region,
      status: resource.status as PlotStatus,
      boundary: (resource.boundary ?? []).map(
        ([latitude, longitude]) => new GeoCoordinate(latitude, longitude),
      ),
      areaHectares: resource.areaHectares,
      agroMonitoringPolygonId: resource.agroMonitoringPolygonId || null,
      soilBaseline: resource.soilBaseline ? this.toSoilBaseline(resource.soilBaseline) : null,
    });

  /**
   * Converts a FieldPlot entity to a FieldPlotResource.
   * @param entity - The entity to convert.
   * @returns The converted FieldPlotResource.
   */
  toResourceFromEntity = (entity: FieldPlot): FieldPlotResource => ({
    id: entity.id as number,
    ownerUserId: entity.ownerUserId,
    name: entity.name,
    region: entity.region,
    status: entity.status,
    boundary: entity.boundary.map((vertex) => [vertex.latitude, vertex.longitude]),
    areaHectares: entity.areaHectares,
    agroMonitoringPolygonId: entity.agroMonitoringPolygonId ?? '',
    soilBaseline: entity.soilBaseline ? this.toSoilBaselineResource(entity.soilBaseline) : null,
  });

  /**
   * Converts a SoilBaselineResource to a SoilBaseline value object.
   * @param resource - The soil analysis as the API sends it.
   */
  private toSoilBaseline = (resource: SoilBaselineResource): SoilBaseline =>
    new SoilBaseline({
      ph: resource.ph,
      texture: resource.texture as SoilTexture,
      organicMatterPercentage: resource.organicMatterPercentage,
      recordedAt: fromApiDate(resource.recordedAt),
    });

  /**
   * Converts a SoilBaseline value object to a SoilBaselineResource.
   * @param soilBaseline - The soil analysis to convert.
   */
  private toSoilBaselineResource = (soilBaseline: SoilBaseline): SoilBaselineResource => ({
    ph: soilBaseline.ph,
    texture: soilBaseline.texture,
    organicMatterPercentage: soilBaseline.organicMatterPercentage,
    recordedAt: toApiDate(soilBaseline.recordedAt),
  });
}
