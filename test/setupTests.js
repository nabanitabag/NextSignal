// Jest setup file for NextSignal tests
import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    close: jest.fn(),
  })),
});

Object.defineProperty(Notification, 'requestPermission', {
  writable: true,
  value: jest.fn().mockResolvedValue('granted'),
});

Object.defineProperty(Notification, 'permission', {
  writable: true,
  value: 'granted',
});

// Mock Google Maps API
global.google = {
  maps: {
    Map: jest.fn(() => ({
      addListener: jest.fn(),
      setCenter: jest.fn(),
      setZoom: jest.fn(),
      fitBounds: jest.fn(),
    })),
    Marker: jest.fn(() => ({
      setMap: jest.fn(),
      addListener: jest.fn(),
    })),
    InfoWindow: jest.fn(() => ({
      open: jest.fn(),
      close: jest.fn(),
      setContent: jest.fn(),
    })),
    places: {
      PlacesService: jest.fn(),
      AutocompleteService: jest.fn(),
    },
    geometry: {
      spherical: {
        computeDistanceBetween: jest.fn(),
      },
    },
    LatLng: jest.fn(),
    LatLngBounds: jest.fn(),
    visualization: {
      HeatmapLayer: jest.fn(),
    },
  },
};

// Mock environment variables
process.env.REACT_APP_FIREBASE_API_KEY = 'test-api-key';
process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
process.env.REACT_APP_FIREBASE_PROJECT_ID = 'test-project';
process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID = '123456789';
process.env.REACT_APP_FIREBASE_APP_ID = '1:123456789:web:abcdef123456';
process.env.REACT_APP_GOOGLE_MAPS_API_KEY = 'test-maps-key';
process.env.REACT_APP_GEMINI_API_KEY = 'test-gemini-key';

// Mock Firebase
jest.mock('../src/config/firebase', () => ({
  app: {},
  db: {},
  storage: {},
  auth: {},
  functions: {},
  messaging: null,
}));

// Console warnings that we want to suppress in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
}); 