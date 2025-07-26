import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './utils/diagnostics'; // Load diagnostics for console access

console.log('🚀 NextSignal: Starting app initialization...');

const rootElement = document.getElementById('root');
console.log('📍 Root element found:', !!rootElement);

if (!rootElement) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element exists, creating React root...');
  
  const root = ReactDOM.createRoot(rootElement);
  console.log('✅ React root created, rendering App...');
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ App rendered successfully');
} 