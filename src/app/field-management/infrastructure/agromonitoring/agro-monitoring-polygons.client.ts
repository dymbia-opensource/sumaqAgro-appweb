import { Observable, of } from 'rxjs';
import { FieldPlot } from '../../domain/model/entities/field-plot.entity';

/**
 * Anti-corruption layer for the AgroMonitoring polygon registry (external system).
 *
 * @remarks
 * AgroMonitoring needs the API key of SumaqAgro, so the web application never
 * calls it: with the RESTful API the backend registers the polygon when it
 * receives `PlotBoundaryDelineated` (policy P3) and returns its identifier.
 * With the fake API this client simulates that answer, keeping the identifier
 * of a plot that was already linked.
 */
export class AgroMonitoringPolygonsClient {
  /**
   * Registers (or updates) the polygon of a plot in AgroMonitoring.
   * @param plot - Plot with its GPS polygon.
   * @returns Polygon identifier in AgroMonitoring.
   */
  registerPolygon(plot: FieldPlot): Observable<string> {
    return of(plot.agroMonitoringPolygonId ?? AgroMonitoringPolygonsClient.newPolygonId());
  }

  /** 24 hexadecimal characters, the format of the AgroMonitoring identifiers. */
  private static newPolygonId(): string {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  }
}
