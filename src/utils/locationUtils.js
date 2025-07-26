/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point  
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};

/**
 * Generate a geohash for geographic coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Precision of the geohash (default: 7)
 * @returns {string} Geohash string
 */
export const generateGeohash = (lat, lng, precision = 7) => {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let latRange = [-90, 90];
  let lngRange = [-180, 180];
  let isEven = true;
  let bit = 0;
  let bitCount = 0;
  let geohash = '';

  while (geohash.length < precision) {
    if (isEven) {
      // Longitude
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (lng >= mid) {
        bit = bit * 2 + 1;
        lngRange[0] = mid;
      } else {
        bit = bit * 2;
        lngRange[1] = mid;
      }
    } else {
      // Latitude
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        bit = bit * 2 + 1;
        latRange[0] = mid;
      } else {
        bit = bit * 2;
        latRange[1] = mid;
      }
    }

    isEven = !isEven;
    bitCount++;

    if (bitCount === 5) {
      geohash += BASE32[bit];
      bit = 0;
      bitCount = 0;
    }
  }

  return geohash;
};

/**
 * Check if a point is within a certain radius of another point
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @param {number} radiusKm - Radius in kilometers
 * @returns {boolean} True if within radius
 */
export const isWithinRadius = (lat1, lng1, lat2, lng2, radiusKm) => {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  return distance <= radiusKm;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees to convert
 * @returns {number} Radians
 */
export const degreesToRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 * @param {number} radians - Radians to convert
 * @returns {number} Degrees
 */
export const radiansToDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

/**
 * Get bounding box coordinates for a center point and radius
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Bounding box with north, south, east, west coordinates
 */
export const getBoundingBox = (lat, lng, radiusKm) => {
  const latRadian = degreesToRadians(lat);
  const degLatKm = 110.574235; // Degrees latitude to kilometers
  const degLngKm = 110.572833 * Math.cos(latRadian); // Degrees longitude to kilometers
  
  const deltaLat = radiusKm / degLatKm;
  const deltaLng = radiusKm / degLngKm;

  return {
    north: lat + deltaLat,
    south: lat - deltaLat,
    east: lng + deltaLng,
    west: lng - deltaLng
  };
}; 