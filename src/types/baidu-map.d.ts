declare namespace BMap {
  class Geocoder {
    constructor();
    getPoint(
      address: string,
      callback: (point: Point) => void,
      city?: string
    ): void;
    getLocation(point: Point, callback: (result: GeocoderResult) => void): void;
  }

  class Point {
    lng: number;
    lat: number;
    constructor(lng: number, lat: number);
  }

  interface GeocoderResult {
    address: string;
    point: Point;
  }
}
