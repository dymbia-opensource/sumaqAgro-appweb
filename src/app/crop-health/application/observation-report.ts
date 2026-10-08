import { SatelliteObservation } from '../domain/model/entities/satellite-observation.entity';
/** Exports recorded values without inventing a diagnosis or a satellite raster. */
export function observationCsv(plotName: string, observation: SatelliteObservation): string {
  const text = (value: string | number) => {
    let raw = String(value);
    if (typeof value === 'string' && /^[=+@\-\t\r]/.test(raw)) raw = "'" + raw;
    return '"' + raw.replace(/"/g, '""') + '"';
  };
  const header = ['plot', 'captured_at', 'ndvi_mean', 'ndwi_mean', 'stress_area_ha', 'recommendation'];
  const values = [plotName, observation.date, observation.ndviMean, observation.ndwiMean, observation.stressAreaHectares, observation.recommendation];
  return '\uFEFF' + header.map(text).join(',') + '\r\n' + values.map(text).join(',') + '\r\n';
}
