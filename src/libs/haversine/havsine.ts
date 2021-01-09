class Haversine {
  /**
   * @description Calculate the ratio of the circumference of a circle to its diameter between two points
   * @private
   * @param {number} lonStart Start point
   * @param {number} lonEnd End point
   * @returns {number}
   */
  toRoad(start: number, end: number): number {
    return ((start - end) / 180) * Math.PI;
  }

  /**
   * @description Calcualte angle by the latitude
   * @private
   * @param {number} angle
   * @returns {number}
   */
  toRadian(angle: number): number {
    return (Math.PI * angle) / 180;
  }

  /**
   * @description Get Distance for curve distance
   * @public
   * @param {number[]} coordStart coordStart[0] represent latitude coordStart[1] represent longtitude
   * @param {number[]} coordEnd coordEnd[0] represent latitude coordEnd[1] represent longtitude
   * @param {boolean} isMiles default is miles, otherwise use kilometer
   * @returns {number}
   */
  distance(coordStart: number[], coordEnd: number[], isKilometer = false) {
    const lat1 = coordStart[0];
    const lat2 = coordEnd[0];
    // Calcualte angle by the latitude
    const radlat1 = this.toRadian(lat1);
    const radlat2 = this.toRadian(lat2);
    // Distance between longtitude
    const dLon = this.toRoad(coordStart[1], coordEnd[1]);

    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(dLon);

    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    // nautical mile is 1/60th of a degree to miles
    dist = dist * 60 * 1.1515;
    if (isKilometer) return dist * 1.609344;
    return dist;
  }
}

export class HaversineFactory {
  /**
   * @description Get Distance for curve distance
   * @public
   * @param {number[]} coordStart coordStart[0] represent latitude coordStart[1] represent longtitude
   * @param {number[]} coordEnd coordEnd[0] represent latitude coordEnd[1] represent longtitude
   * @param {boolean} isMiles default is miles, otherwise use kilometer
   * @returns {number}
   */
  static calc(coordStart: number[], coordEnd: number[], isKilometer = false) {
    return new Haversine().distance(coordStart, coordEnd, isKilometer);
  }
}
