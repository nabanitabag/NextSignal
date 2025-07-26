/**
 * Diagnostic utilities to test Google service connections and API keys
 */

// Test Firebase configuration
export const testFirebaseConfig = () => {
  console.log('🔧 Testing Firebase Configuration...');
  
  const requiredKeys = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN', 
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID'
  ];
  
  const results = {};
  
  requiredKeys.forEach(key => {
    const value = process.env[key];
    results[key] = {
      exists: !!value,
      length: value?.length || 0,
      preview: value ? `${value.substring(0, 10)}...` : 'Not set'
    };
  });
  
  console.table(results);
  
  const missingKeys = requiredKeys.filter(key => !process.env[key]);
  if (missingKeys.length > 0) {
    console.error('❌ Missing Firebase keys:', missingKeys);
    return false;
  }
  
  console.log('✅ All Firebase keys present');
  return true;
};

// Test Google Maps API
export const testGoogleMapsAPI = async () => {
  console.log('🗺️ Testing Google Maps API...');
  
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Google Maps API key not found');
    return { success: false, error: 'API key missing' };
  }
  
  try {
    // Test with a simple geocoding request
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=San+Francisco&key=${apiKey}`;
    
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (data.status === 'OK') {
      console.log('✅ Google Maps API: Working');
      return { success: true, results: data.results.length };
    } else {
      console.error('❌ Google Maps API Error:', data.status, data.error_message);
      return { success: false, error: data.error_message || data.status };
    }
  } catch (error) {
    console.error('❌ Google Maps API Network Error:', error);
    return { success: false, error: error.message };
  }
};

// List available Gemini models
export const listGeminiModels = async () => {
  console.log('🤖 Listing available Gemini models...');
  
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Gemini API key not found');
    return { success: false, error: 'API key missing' };
  }
  
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    const response = await fetch(listUrl);
    const data = await response.json();
    
    if (response.ok && data.models) {
      console.log('✅ Available Gemini models:', data.models.map(m => m.name));
      return { success: true, models: data.models };
    } else {
      console.error('❌ Error listing models:', data.error || data);
      return { success: false, error: data.error?.message || 'Unknown error' };
    }
  } catch (error) {
    console.error('❌ Network error listing models:', error);
    return { success: false, error: error.message };
  }
};

// Test Gemini AI API
export const testGeminiAPI = async () => {
  console.log('🤖 Testing Gemini AI API...');
  
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Gemini API key not found');
    return { success: false, error: 'API key missing' };
  }
  
  // First, try to list models to find the correct one
  const modelsResult = await listGeminiModels();
  let modelName = 'gemini-1.5-flash'; // Default to newer model
  
  if (modelsResult.success && modelsResult.models) {
    // Look for available models that support generateContent
    const supportedModels = modelsResult.models.filter(model => 
      model.supportedGenerationMethods?.includes('generateContent') &&
      (model.name.includes('gemini-1.5-flash') || 
       model.name.includes('gemini-1.5-pro') || 
       model.name.includes('gemini-pro'))
    );
    
    if (supportedModels.length > 0) {
      // Use the first supported model, preferring flash for speed
      const flashModel = supportedModels.find(m => m.name.includes('flash'));
      const proModel = supportedModels.find(m => m.name.includes('pro'));
      modelName = flashModel?.name || proModel?.name || supportedModels[0].name;
      modelName = modelName.replace('models/', ''); // Remove prefix if present
    }
  }
  
  try {
    // Test with a simple text generation request using the detected model
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    console.log(`🤖 Testing with model: ${modelName}`);
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Say "Hello" in a friendly way.'
          }]
        }]
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.candidates) {
      console.log('✅ Gemini AI API: Working');
      return { 
        success: true, 
        response: data.candidates[0]?.content?.parts[0]?.text,
        modelUsed: modelName
      };
    } else {
      console.error('❌ Gemini AI API Error:', data.error || data);
      
      // If the first model fails, try with gemini-pro as fallback
      if (modelName !== 'gemini-pro') {
        console.log('🤖 Retrying with gemini-pro...');
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
        
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Say "Hello" in a friendly way.'
              }]
            }]
          })
        });
        
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackResponse.ok && fallbackData.candidates) {
          console.log('✅ Gemini AI API: Working with gemini-pro');
          return { 
            success: true, 
            response: fallbackData.candidates[0]?.content?.parts[0]?.text,
            modelUsed: 'gemini-pro'
          };
        }
      }
      
      return { 
        success: false, 
        error: data.error?.message || `Model ${modelName} not supported`,
        availableModels: modelsResult.models?.map(m => m.name) || []
      };
    }
  } catch (error) {
    console.error('❌ Gemini AI API Network Error:', error);
    return { success: false, error: error.message };
  }
};

// Test Firebase Firestore connection
export const testFirestoreConnection = async () => {
  console.log('🔥 Testing Firestore Connection...');
  
  try {
    // Import Firebase dynamically to test real connection
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, enableNetwork } = await import('firebase/firestore');
    
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    };
    
    const app = initializeApp(firebaseConfig, 'diagnostic-test');
    const db = getFirestore(app);
    
    // Try to enable network (this will fail if project doesn't exist)
    await enableNetwork(db);
    
    console.log('✅ Firestore: Connection successful');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Firestore Connection Error:', error);
    return { success: false, error: error.message };
  }
};

// Run all diagnostics
export const runFullDiagnostics = async () => {
  console.log('🔍 Running NextSignal Diagnostics...');
  console.log('=====================================');
  
  const results = {
    timestamp: new Date().toISOString(),
    firebase: {
      config: testFirebaseConfig(),
      connection: null
    },
    googleMaps: null,
    geminiAI: null
  };
  
  try {
    // Test Firebase connection
    results.firebase.connection = await testFirestoreConnection();
    
    // Test Google Maps
    results.googleMaps = await testGoogleMapsAPI();
    
    // Test Gemini AI  
    results.geminiAI = await testGeminiAPI();
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  }
  
  console.log('=====================================');
  console.log('📊 Diagnostic Summary:');
  console.table({
    'Firebase Config': results.firebase.config ? '✅ Valid' : '❌ Invalid',
    'Firebase Connection': results.firebase.connection?.success ? '✅ Connected' : '❌ Failed',
    'Google Maps API': results.googleMaps?.success ? '✅ Working' : '❌ Failed', 
    'Gemini AI API': results.geminiAI?.success ? '✅ Working' : '❌ Failed'
  });
  
  // Show specific errors
  if (!results.firebase.connection?.success) {
    console.error('🔥 Firebase Error:', results.firebase.connection?.error);
  }
  if (!results.googleMaps?.success) {
    console.error('🗺️ Google Maps Error:', results.googleMaps?.error);
  }
  if (!results.geminiAI?.success) {
    console.error('🤖 Gemini AI Error:', results.geminiAI?.error);
  }
  
  return results;
};

// Check environment file
export const checkEnvironmentFile = () => {
  console.log('📁 Checking Environment Configuration...');
  
  const allEnvVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID', 
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID',
    'REACT_APP_FIREBASE_MEASUREMENT_ID',
    'REACT_APP_GOOGLE_MAPS_API_KEY',
    'REACT_APP_GEMINI_API_KEY',
    'REACT_APP_FIREBASE_VAPID_KEY'
  ];
  
  const status = {};
  
  allEnvVars.forEach(varName => {
    const value = process.env[varName];
    status[varName] = {
      '✓ Set': !!value,
      'Length': value?.length || 0,
      'Type': value ? (varName.includes('KEY') ? 'API Key' : 'Config') : 'Missing'
    };
  });
  
  console.table(status);
  
  const missing = allEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn('⚠️ Missing environment variables:');
    missing.forEach(key => console.warn(`  - ${key}`));
  }
  
  return missing.length === 0;
};

// Make diagnostics available globally for console usage
if (typeof window !== 'undefined') {
  window.NextSignalDiagnostics = {
    runFullDiagnostics,
    testFirebaseConfig,
    testGoogleMapsAPI,
    testGeminiAPI,
    listGeminiModels,
    testFirestoreConnection,
    checkEnvironmentFile
  };
  
  console.log('🔍 NextSignal Diagnostics available! Try:');
  console.log('  window.NextSignalDiagnostics.runFullDiagnostics()');
  console.log('  window.NextSignalDiagnostics.listGeminiModels()');
  console.log('  window.NextSignalDiagnostics.checkEnvironmentFile()');
} 