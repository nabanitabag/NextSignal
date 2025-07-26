import { calculateDistance, generateGeohash } from '../locationUtils';

describe('Location Utilities', () => {
  describe('calculateDistance', () => {
    test('calculates distance between two identical points', () => {
      const lat = 40.7128;
      const lng = -74.0060;
      
      const distance = calculateDistance(lat, lng, lat, lng);
      expect(distance).toBe(0);
    });

    test('calculates distance between New York and Los Angeles', () => {
      // New York City coordinates
      const nyLat = 40.7128;
      const nyLng = -74.0060;
      
      // Los Angeles coordinates  
      const laLat = 34.0522;
      const laLng = -118.2437;
      
      const distance = calculateDistance(nyLat, nyLng, laLat, laLng);
      
      // Distance should be approximately 3944 km
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    test('calculates distance between close points', () => {
      // Two points in Manhattan about 1 mile apart
      const lat1 = 40.7589;
      const lng1 = -73.9851;
      const lat2 = 40.7505;
      const lng2 = -73.9934;
      
      const distance = calculateDistance(lat1, lng1, lat2, lng2);
      
      // Should be approximately 1.2 km
      expect(distance).toBeGreaterThan(1.0);
      expect(distance).toBeLessThan(1.5);
    });

    test('handles negative coordinates', () => {
      const distance = calculateDistance(-33.8688, 151.2093, -37.8136, 144.9631);
      
      // Distance between Sydney and Melbourne (~715 km)
      expect(distance).toBeGreaterThan(700);
      expect(distance).toBeLessThan(750);
    });

    test('returns positive distance regardless of point order', () => {
      const lat1 = 40.7589;
      const lng1 = -73.9851;
      const lat2 = 40.7505;
      const lng2 = -73.9934;
      
      const distance1 = calculateDistance(lat1, lng1, lat2, lng2);
      const distance2 = calculateDistance(lat2, lng2, lat1, lng1);
      
      expect(distance1).toBe(distance2);
      expect(distance1).toBeGreaterThan(0);
    });
  });

  describe('generateGeohash', () => {
    test('generates consistent geohash for same coordinates', () => {
      const lat = 40.7128;
      const lng = -74.0060;
      
      const hash1 = generateGeohash(lat, lng);
      const hash2 = generateGeohash(lat, lng);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    test('generates different geohashes for different coordinates', () => {
      const hash1 = generateGeohash(40.7128, -74.0060); // NYC
      const hash2 = generateGeohash(34.0522, -118.2437); // LA
      
      expect(hash1).not.toBe(hash2);
    });

    test('generates geohash with default precision', () => {
      const hash = generateGeohash(40.7128, -74.0060);
      
      // Default precision should be 7 characters
      expect(hash.length).toBe(7);
    });

    test('generates geohash with custom precision', () => {
      const precision = 5;
      const hash = generateGeohash(40.7128, -74.0060, precision);
      
      expect(hash.length).toBe(precision);
    });

    test('handles edge case coordinates', () => {
      // Test with extreme coordinates
      const hash1 = generateGeohash(90, 180);   // North Pole, International Date Line
      const hash2 = generateGeohash(-90, -180); // South Pole, opposite side
      const hash3 = generateGeohash(0, 0);       // Equator, Prime Meridian
      
      expect(typeof hash1).toBe('string');
      expect(typeof hash2).toBe('string');
      expect(typeof hash3).toBe('string');
      expect(hash1).not.toBe(hash2);
      expect(hash2).not.toBe(hash3);
    });

    test('generates shorter prefix for nearby locations', () => {
      // Locations very close to each other should have similar geohash prefixes
      const hash1 = generateGeohash(40.7128, -74.0060);
      const hash2 = generateGeohash(40.7129, -74.0061);
      
      // First few characters should be the same for nearby locations
      expect(hash1.substring(0, 4)).toBe(hash2.substring(0, 4));
    });
  });
}); 