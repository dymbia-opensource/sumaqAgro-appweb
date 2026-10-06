import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { FieldPlot } from '../../domain/model/entities/field-plot.entity';
import { GeoCoordinate } from '../../domain/model/entities/geo-coordinate.entity';
import { PlotStatus } from '../../domain/model/entities/plot-status';
import { FieldPlotResource, FieldPlotsResponse } from '../responses/field-plot.response';

/** Maps field plots between the RESTful API and the domain. */
export class FieldPlotAssembler implements BaseAssembler<
  FieldPlot,
  FieldPlotResource,
  FieldPlotsResponse
> {
  toEntityFromResource(resource: FieldPlotResource): FieldPlot {
    return new FieldPlot({
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
  }

  toResourceFromEntity(entity: FieldPlot): FieldPlotResource {
    return {
      id: entity.id as number,
      ownerUserId: entity.ownerUserId,
      name: entity.name,
      region: entity.region,
      status: entity.status,
      boundary: entity.boundary.map((vertex) => [vertex.latitude, vertex.longitude]),
      areaHectares: entity.areaHectares,
      agroMonitoringPolygonId: entity.agroMonitoringPolygonId ?? '',
    };
  }

  toEntitiesFromResponse(response: FieldPlotsResponse): FieldPlot[] {
    return response.plots.map((resource) => this.toEntityFromResource(resource));
  }
}
