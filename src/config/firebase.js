import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getMessaging, isSupported } from 'firebase/messaging';

// Your Firebase config object - loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "nextsignal-demo.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "nextsignal-demo",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "nextsignal-demo.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Debug: Log environment variable loading
console.log('🔧 Firebase Config Debug:', {
  apiKeyLoaded: !!process.env.REACT_APP_FIREBASE_API_KEY,
  projectIdLoaded: !!process.env.REACT_APP_FIREBASE_PROJECT_ID,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'Not loaded',
  mapsApiKeyLoaded: !!process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  geminiApiKeyLoaded: !!process.env.REACT_APP_GEMINI_API_KEY,
  configUsed: {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  }
});

console.log('🔥 Firebase: Starting initialization...');

// Initialize Firebase
console.log('🔥 Firebase: Initializing app with config...');
const app = initializeApp(firebaseConfig);
console.log('✅ Firebase: App initialized');

// Initialize Firebase services
console.log('🔥 Firebase: Initializing services...');
export const db = getFirestore(app);
console.log('✅ Firebase: Firestore initialized');

export const storage = getStorage(app);
console.log('✅ Firebase: Storage initialized');

export const auth = getAuth(app);
console.log('✅ Firebase: Auth initialized');

export const functions = getFunctions(app);
console.log('✅ Firebase: Functions initialized');

// Initialize messaging if supported
let messaging = null;
isSupported().then(supported => {
  if (supported) {
    messaging = getMessaging(app);
  }
});
export { messaging };

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  const connectToEmulators = () => {
    try {
      // Connect to Firestore emulator
      if (!db._delegate._terminated) {
        connectFirestoreEmulator(db, 'localhost', 8080);
      }
    } catch (error) {
      console.log('Firestore emulator already connected');
    }

    try {
      // Connect to Storage emulator
      connectStorageEmulator(storage, 'localhost', 9199);
    } catch (error) {
      console.log('Storage emulator already connected');
    }

    try {
      // Connect to Auth emulator
      connectAuthEmulator(auth, 'http://localhost:9099');
    } catch (error) {
      console.log('Auth emulator already connected');
    }

    try {
      // Connect to Functions emulator
      connectFunctionsEmulator(functions, 'localhost', 5001);
    } catch (error) {
      console.log('Functions emulator already connected');
    }
  };

  // Only connect to emulators if the environment variable is set
  if (process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
    connectToEmulators();
  }
}

export default app; 