import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/DemoAuthContext';
import { DataProvider } from './contexts/DemoDataContext';
import { MapProvider } from './contexts/DemoMapContext';
import Navbar from './components/layout/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

console.log('📱 App.js: Component loading...');

// Lazy load components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ReportSubmission = lazy(() => import('./pages/ReportSubmission'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));
const TestPage = lazy(() => import('./pages/TestPage'));
const Diagnostics = lazy(() => import('./pages/Diagnostics'));

function App() {
  console.log('📱 App: Rendering App component...');
  
  try {
    console.log('✅ App: Creating Router...');
    return (
      <ErrorBoundary>
        <Router>
          <AuthProvider>
            <DataProvider>
              <MapProvider>
                <div className="App">
                  <Navbar />
                  <main className="main-content">
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/test" element={<TestPage />} />
                        <Route path="/diagnostics" element={<Diagnostics />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/report" element={<ReportSubmission />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </main>
                </div>
              </MapProvider>
            </DataProvider>
          </AuthProvider>
        </Router>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('❌ App: Error rendering App component:', error);
    return <div>Error loading app: {error.message}</div>;
  }
}

export default App; 