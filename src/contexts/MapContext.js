import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const MapContext = createContext();

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};

export const MapProvider = ({ children }) => {
  const [map, setMap] = useState(null);
  const [mapLibrary, setMapLibrary] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default map center (Bangalore, India - can be changed)
  const defaultCenter = { lat: 12.9716, lng: 77.5946 };
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(12);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolocation is not supported by this browser.');
        setError(error.message);
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          setUserLocation(location);
          setMapCenter(location);
          resolve(location);
        },
        (error) => {
          console.warn('Error getting location:', error.message);
          // Don't set as error, just use default location
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        console.log('🗺️ Google Maps API Key Debug:', {
          keyExists: !!apiKey,
          keyLength: apiKey?.length || 0,
          keyPrefix: apiKey?.substring(0, 10) + '...' || 'Not found'
        });
        
        if (!apiKey) {
          throw new Error('Google Maps API key not found. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your environment variables.');
        }

        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry', 'visualization']
        });

        const google = await loader.load();
        setMapLibrary(google.maps);
        setIsLoaded(true);
        
        // Try to get user's location
        await getCurrentLocation();
        
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeMap();
  }, [getCurrentLocation]);

  // Initialize map instance
  const initializeMapInstance = useCallback((mapContainer) => {
    if (!mapLibrary || !mapContainer) return null;

    const mapOptions = {
      center: mapCenter,
      zoom: mapZoom,
      mapTypeId: mapLibrary.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          "featureType": "poi",
          "elementType": "labels",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "transit",
          "elementType": "labels",
          "stylers": [{"visibility": "off"}]
        }
      ]
    };

    const mapInstance = new mapLibrary.Map(mapContainer, mapOptions);
    setMap(mapInstance);

    // Add click listener for location selection
    mapInstance.addListener('click', (event) => {
      const clickedLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      setSelectedLocation(clickedLocation);
    });

    return mapInstance;
  }, [mapLibrary, mapCenter, mapZoom]);

  // Geocode address to coordinates
  const geocodeAddress = useCallback(async (address) => {
    if (!mapLibrary) {
      throw new Error('Google Maps not loaded');
    }

    const geocoder = new mapLibrary.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
            address: results[0].formatted_address,
            placeId: results[0].place_id
          };
          resolve(location);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }, [mapLibrary]);

  // Reverse geocode coordinates to address
  const reverseGeocode = useCallback(async (lat, lng) => {
    if (!mapLibrary) {
      throw new Error('Google Maps not loaded');
    }

    const geocoder = new mapLibrary.Geocoder();
    const latLng = new mapLibrary.LatLng(lat, lng);
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve({
            address: results[0].formatted_address,
            components: results[0].address_components,
            placeId: results[0].place_id
          });
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }, [mapLibrary]);

  // Add marker to map
  const addMarker = useCallback((position, options = {}) => {
    if (!map || !mapLibrary) return null;

    const marker = new mapLibrary.Marker({
      position,
      map,
      title: options.title || '',
      icon: options.icon || null,
      animation: options.animation || null
    });

    if (options.infoWindow) {
      const infoWindow = new mapLibrary.InfoWindow({
        content: options.infoWindow
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    }

    return marker;
  }, [map, mapLibrary]);

  // Add multiple markers for reports/events
  const addMarkersForData = useCallback((dataPoints, type = 'report') => {
    if (!map || !mapLibrary) return [];

    const markers = [];
    
    dataPoints.forEach(point => {
      let icon, title, content;
      
      if (type === 'report') {
        icon = {
          url: getReportIcon(point.category, point.severity),
          scaledSize: new mapLibrary.Size(32, 32)
        };
        title = point.title;
        content = `
          <div style="max-width: 200px;">
            <h4>${point.title}</h4>
            <p>${point.description}</p>
            <small>Reported: ${new Date(point.timestamp?.toDate?.() || point.timestamp).toLocaleString()}</small>
          </div>
        `;
      } else if (type === 'event') {
        icon = {
          url: getEventIcon(point.category, point.severity),
          scaledSize: new mapLibrary.Size(36, 36)
        };
        title = point.title;
        content = `
          <div style="max-width: 250px;">
            <h4>${point.title}</h4>
            <p>${point.description}</p>
            <p><strong>Severity:</strong> ${point.severity}</p>
            <p><strong>Reports:</strong> ${point.reportCount || 0}</p>
            <small>Synthesized: ${new Date(point.timestamp?.toDate?.() || point.timestamp).toLocaleString()}</small>
          </div>
        `;
      }

      const marker = addMarker(point.location, {
        title,
        icon,
        infoWindow: content
      });

      markers.push({ marker, data: point });
    });

    return markers;
  }, [map, mapLibrary, addMarker]);

  // Add heatmap layer
  const addHeatmapLayer = useCallback((dataPoints, options = {}) => {
    if (!map || !mapLibrary) return null;

    const heatmapData = dataPoints.map(point => ({
      location: new mapLibrary.LatLng(point.location.lat, point.location.lng),
      weight: point.weight || 1
    }));

    const heatmap = new mapLibrary.visualization.HeatmapLayer({
      data: heatmapData,
      map: map,
      radius: options.radius || 20,
      opacity: options.opacity || 0.6
    });

    return heatmap;
  }, [map, mapLibrary]);

  // Center map on location
  const centerMapOn = useCallback((location, zoom = null) => {
    if (!map) return;

    map.setCenter(location);
    if (zoom) {
      map.setZoom(zoom);
    }
    setMapCenter(location);
    if (zoom) setMapZoom(zoom);
  }, [map]);

  // Fit map to bounds
  const fitMapToBounds = useCallback((bounds) => {
    if (!map) return;

    map.fitBounds(bounds);
  }, [map]);

  // Helper function to get report icon based on category and severity
  const getReportIcon = (category, severity) => {
    const baseUrl = 'https://maps.google.com/mapfiles/ms/icons/';
    const severityPrefix = severity === 'high' ? 'red' : severity === 'medium' ? 'yellow' : 'green';
    return `${baseUrl}${severityPrefix}-dot.png`;
  };

  // Helper function to get event icon
  const getEventIcon = (category, severity) => {
    const baseUrl = 'https://maps.google.com/mapfiles/ms/icons/';
    
    const severityIcons = {
      high: 'red-pushpin.png',
      medium: 'yellow-pushpin.png',
      low: 'green-pushpin.png'
    };

    return `${baseUrl}${severityIcons[severity] || severityIcons.medium}`;
  };

  const value = {
    // Map state
    map,
    mapLibrary,
    isLoaded,
    loading,
    error,
    
    // Location state
    userLocation,
    selectedLocation,
    mapCenter,
    mapZoom,
    
    // Map functions
    initializeMapInstance,
    getCurrentLocation,
    geocodeAddress,
    reverseGeocode,
    centerMapOn,
    fitMapToBounds,
    
    // Marker functions
    addMarker,
    addMarkersForData,
    addHeatmapLayer,
    
    // Setters
    setSelectedLocation,
    setMapCenter,
    setMapZoom
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}; 