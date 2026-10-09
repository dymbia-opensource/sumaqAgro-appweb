import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { FieldPlot } from '../../domain/model/entities/field-plot.entity';
import { GeoCoordinate } from '../../domain/model/entities/geo-coordinate';
import { PlotStatus } from '../../domain/model/entities/plot-status';
import { FieldPlotResource } from '../responses/field-plot.response';
import { FieldPlotsResponse } from '../responses/field-plots.response';

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
  });
}
