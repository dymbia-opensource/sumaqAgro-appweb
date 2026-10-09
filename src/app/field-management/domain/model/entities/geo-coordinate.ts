/**
 * GPS vertex of a plot polygon.
 *
 * @remarks
 * It is a value that belongs to {@link FieldPlot}; it has no identity of its own.
 */
export class GeoCoordinate {
  private readonly _latitude: number;
  private readonly _longitude: number;

  /**
   * Creates a GPS vertex.
   * @param latitude - Latitude in degrees, between -90 and 90.
   * @param longitude - Longitude in degrees, between -180 and 180.
   */
  constructor(latitude: number, longitude: number) {
    if (latitude < -90 || latitude > 90) {
      throw new Error('The latitude must be between -90 and 90.');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('The longitude must be between -180 and 180.');
    }
    this._latitude = latitude;
    this._longitude = longitude;
  }

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }
}
