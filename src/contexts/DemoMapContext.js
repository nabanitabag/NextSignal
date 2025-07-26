import React, { createContext, useContext, useState } from 'react';

const MapContext = createContext();

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};

export const MapProvider = ({ children }) => {
  console.log('🗺️ DemoMapContext: Using demo maps mode');

  const [isLoaded] = useState(true);
  const [loading] = useState(false);
  const [error] = useState(null);
  const [userLocation] = useState({
    lat: 37.7749,
    lng: -122.4194,
    accuracy: 100
  });
  const [mapInstance, setMapInstance] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Mock map functions
  const initializeMapInstance = (mapContainer) => {
    console.log('🗺️ Demo: initializeMapInstance called', mapContainer);
    
    // Create a mock map object
    const mockMap = {
      setCenter: (location) => console.log('🗺️ Demo: setCenter', location),
      setZoom: (zoom) => console.log('🗺️ Demo: setZoom', zoom),
      addListener: (event, callback) => console.log('🗺️ Demo: addListener', event),
      fitBounds: (bounds) => console.log('🗺️ Demo: fitBounds', bounds),
      panTo: (location) => console.log('🗺️ Demo: panTo', location)
    };
    
    setMapInstance(mockMap);
    return mockMap;
  };

  const getCurrentLocation = async () => {
    console.log('🗺️ Demo: getCurrentLocation called');
    return userLocation;
  };

  const geocodeAddress = async (address) => {
    console.log('🗺️ Demo: geocodeAddress called', address);
    return {
      lat: 37.7749 + (Math.random() - 0.5) * 0.01,
      lng: -122.4194 + (Math.random() - 0.5) * 0.01,
      formatted_address: address
    };
  };

  const reverseGeocode = async (lat, lng) => {
    console.log('🗺️ Demo: reverseGeocode called', { lat, lng });
    return {
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)} - Demo Address`,
      formatted_address: `${lat.toFixed(4)}, ${lng.toFixed(4)} - Demo Address`,
      address_components: []
    };
  };

  const addMarker = (location, options = {}) => {
    console.log('🗺️ Demo: addMarker called', { location, options });
    return {
      marker: {
        setMap: (map) => console.log('🗺️ Demo: marker setMap', map),
        addListener: (event, callback) => console.log('🗺️ Demo: marker addListener', event)
      }
    };
  };

  const addMarkersForData = (data, type) => {
    console.log('🗺️ Demo: addMarkersForData called', { data, type });
    return data.map(item => addMarker(item.location, { type }));
  };

  const addHeatmapLayer = (map, data) => {
    console.log('🗺️ Demo: addHeatmapLayer called', { data });
    return {
      setMap: (map) => console.log('🗺️ Demo: heatmap setMap', map),
      setData: (data) => console.log('🗺️ Demo: heatmap setData', data)
    };
  };

  const centerMapOn = (map, location, zoom = 15) => {
    console.log('🗺️ Demo: centerMapOn called', { location, zoom });
    if (map) {
      map.setCenter(location);
      map.setZoom(zoom);
    }
  };

  const fitMapToBounds = (map, locations) => {
    console.log('🗺️ Demo: fitMapToBounds called', { locations });
    if (map && locations.length > 0) {
      map.fitBounds({
        north: Math.max(...locations.map(l => l.lat)) + 0.001,
        south: Math.min(...locations.map(l => l.lat)) - 0.001,
        east: Math.max(...locations.map(l => l.lng)) + 0.001,
        west: Math.min(...locations.map(l => l.lng)) - 0.001
      });
    }
  };

  const value = {
    isLoaded,
    loading,
    error,
    userLocation,
    mapInstance,
    selectedLocation,
    setSelectedLocation,
    initializeMapInstance,
    getCurrentLocation,
    geocodeAddress,
    reverseGeocode,
    addMarker,
    addMarkersForData,
    addHeatmapLayer,
    centerMapOn,
    fitMapToBounds
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}; 