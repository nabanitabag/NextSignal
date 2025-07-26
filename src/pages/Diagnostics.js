import React, { useState } from 'react';
import { runFullDiagnostics, checkEnvironmentFile, listGeminiModels } from '../utils/diagnostics';

const Diagnostics = () => {
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    setDiagnosticResults(null);
    
    try {
      console.log('🔍 Starting NextSignal Diagnostics...');
      const results = await runFullDiagnostics();
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      setDiagnosticResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCheckEnvironment = () => {
    console.log('📁 Checking environment variables...');
    checkEnvironmentFile();
  };

  const handleListGeminiModels = async () => {
    console.log('🤖 Listing Gemini models...');
    try {
      const result = await listGeminiModels();
      if (result.success) {
        console.log('Available models:', result.models);
        alert(`Found ${result.models.length} Gemini models. Check console for details.`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error listing models:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const getStatusIcon = (success) => {
    if (success === true) return '✅';
    if (success === false) return '❌';
    return '⏳';
  };

  const getStatusColor = (success) => {
    if (success === true) return 'border-green-500 bg-green-50';
    if (success === false) return 'border-red-500 bg-red-50';
    return 'border-blue-500 bg-blue-50';
  };

  return (
    <div className="min-h-screen">
      <div className="container">
        <div className="h-[calc(100vh-2rem)] flex flex-col">
          
          {/* Modern Header */}
          <div className="dashboard-header">
            <div className="text-center">
              <h1 className="dashboard-title">
                🔍 NextSignal Diagnostics
              </h1>
              <p className="text-gray-600 text-lg">
                Test your Google service connections and API key configurations
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <button
                onClick={handleRunDiagnostics}
                disabled={isRunning}
                className={`modern-btn ${isRunning ? 'btn-toggle' : 'btn-primary'} flex items-center justify-center space-x-3 py-4`}
              >
                <span className={`material-icons text-xl ${isRunning ? 'animate-spin' : ''}`}>
                  {isRunning ? 'refresh' : 'play_circle'}
                </span>
                <span className="font-medium">
                  {isRunning ? 'Running Tests...' : 'Run Full Diagnostics'}
                </span>
              </button>

              <button
                onClick={handleCheckEnvironment}
                className="modern-btn btn-toggle flex items-center justify-center space-x-3 py-4"
              >
                <span className="material-icons text-xl">settings</span>
                <span className="font-medium">Check Environment</span>
              </button>

              <button
                onClick={handleListGeminiModels}
                className="modern-btn btn-toggle flex items-center justify-center space-x-3 py-4"
              >
                <span className="material-icons text-xl">smart_toy</span>
                <span className="font-medium">List Gemini Models</span>
              </button>
            </div>
          </div>

          <div className="flex-1 flex gap-6 pb-4">
            
            {/* Results Panel */}
            <div className="flex-1 space-y-6">
              
              {/* Status Cards */}
              {diagnosticResults && !diagnosticResults.error && (
                <div className="modern-card">
                  <div className="flex items-center space-x-2 mb-6">
                    <span className="material-icons text-blue-600">dashboard</span>
                    <h2 className="text-xl font-semibold text-gray-800">Service Status</h2>
                    <span className="text-sm text-gray-500">
                      ({new Date(diagnosticResults.timestamp).toLocaleString()})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Firebase Config */}
                    <div className={`stats-card ${getStatusColor(diagnosticResults.firebase?.config)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="stat-icon">🔧</div>
                          <div>
                            <div className="text-lg font-semibold text-gray-800">Firebase Config</div>
                            <div className="text-sm text-gray-600">Configuration validation</div>
                          </div>
                        </div>
                        <div className="text-3xl">
                          {getStatusIcon(diagnosticResults.firebase?.config)}
                        </div>
                      </div>
                    </div>

                    {/* Firestore Connection */}
                    <div className={`stats-card ${getStatusColor(diagnosticResults.firebase?.connection?.success)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="stat-icon">🔥</div>
                          <div>
                            <div className="text-lg font-semibold text-gray-800">Firestore</div>
                            <div className="text-sm text-gray-600">Database connection</div>
                          </div>
                        </div>
                        <div className="text-3xl">
                          {getStatusIcon(diagnosticResults.firebase?.connection?.success)}
                        </div>
                      </div>
                      {diagnosticResults.firebase?.connection?.error && (
                        <div className="mt-3 p-2 bg-red-100 rounded-lg">
                          <p className="text-xs text-red-700">
                            {diagnosticResults.firebase.connection.error}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Google Maps */}
                    <div className={`stats-card ${getStatusColor(diagnosticResults.googleMaps?.success)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="stat-icon">🗺️</div>
                          <div>
                            <div className="text-lg font-semibold text-gray-800">Google Maps</div>
                            <div className="text-sm text-gray-600">Geocoding API</div>
                          </div>
                        </div>
                        <div className="text-3xl">
                          {getStatusIcon(diagnosticResults.googleMaps?.success)}
                        </div>
                      </div>
                      {diagnosticResults.googleMaps?.error && (
                        <div className="mt-3 p-2 bg-red-100 rounded-lg">
                          <p className="text-xs text-red-700">
                            {diagnosticResults.googleMaps.error}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Gemini AI */}
                    <div className={`stats-card ${getStatusColor(diagnosticResults.geminiAI?.success)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="stat-icon">🤖</div>
                          <div>
                            <div className="text-lg font-semibold text-gray-800">Gemini AI</div>
                            <div className="text-sm text-gray-600">AI generation API</div>
                          </div>
                        </div>
                        <div className="text-3xl">
                          {getStatusIcon(diagnosticResults.geminiAI?.success)}
                        </div>
                      </div>
                      {diagnosticResults.geminiAI?.error && (
                        <div className="mt-3 p-2 bg-red-100 rounded-lg">
                          <p className="text-xs text-red-700">
                            {diagnosticResults.geminiAI.error}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {diagnosticResults?.error && (
                <div className="modern-card border-l-4 border-red-500 bg-red-50">
                  <div className="flex items-center space-x-3">
                    <span className="material-icons text-red-600 text-2xl">error</span>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">Diagnostic Error</h3>
                      <p className="text-red-700">{diagnosticResults.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Results */}
              {diagnosticResults && !diagnosticResults.error && (
                <div className="modern-card">
                  <div className="flex items-center space-x-2 mb-6">
                    <span className="material-icons text-green-600">fact_check</span>
                    <h3 className="text-xl font-semibold text-gray-800">Detailed Results</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {diagnosticResults.googleMaps?.success && (
                      <div className="list-item border-l-4 border-green-500 bg-green-50">
                        <div className="flex items-center space-x-3">
                          <span className="text-green-600 text-xl">✅</span>
                          <div>
                            <p className="font-medium text-green-800">Google Maps API</p>
                            <p className="text-sm text-green-700">
                              Found {diagnosticResults.googleMaps.results} geocoding results for test query
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {diagnosticResults.geminiAI?.success && (
                      <div className="list-item border-l-4 border-green-500 bg-green-50">
                        <div className="flex items-center space-x-3">
                          <span className="text-green-600 text-xl">✅</span>
                          <div>
                            <p className="font-medium text-green-800">
                              Gemini AI ({diagnosticResults.geminiAI.modelUsed})
                            </p>
                            <p className="text-sm text-green-700">
                              Response: "{diagnosticResults.geminiAI.response}"
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {diagnosticResults.geminiAI?.error && (
                      <div className="list-item border-l-4 border-red-500 bg-red-50">
                        <div className="flex items-start space-x-3">
                          <span className="text-red-600 text-xl">❌</span>
                          <div className="flex-1">
                            <p className="font-medium text-red-800">Gemini AI Error</p>
                            <p className="text-sm text-red-700 mb-2">
                              {diagnosticResults.geminiAI.error}
                            </p>
                            {diagnosticResults.geminiAI.availableModels && diagnosticResults.geminiAI.availableModels.length > 0 && (
                              <details className="mt-2">
                                <summary className="text-red-700 cursor-pointer text-sm font-medium">
                                  Available Models ({diagnosticResults.geminiAI.availableModels.length})
                                </summary>
                                <div className="mt-2 max-h-32 overflow-y-auto">
                                  {diagnosticResults.geminiAI.availableModels.map(model => (
                                    <div key={model} className="text-xs text-red-600 py-1 px-2 bg-red-100 rounded mb-1">
                                      {model}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No Results State */}
              {!diagnosticResults && (
                <div className="modern-card text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to Diagnose</h3>
                  <p className="text-gray-600">Click "Run Full Diagnostics" to test all your service connections</p>
                </div>
              )}
            </div>

            {/* Info Panel */}
            <div className="w-96 space-y-6">
              
              {/* Console Commands */}
              <div className="modern-card">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="material-icons text-purple-600">terminal</span>
                  <h3 className="text-lg font-semibold text-gray-800">Console Commands</h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  Run diagnostics directly in the browser console:
                </p>
                
                <div className="space-y-2">
                  {[
                    'window.NextSignalDiagnostics.runFullDiagnostics()',
                    'window.NextSignalDiagnostics.listGeminiModels()',
                    'window.NextSignalDiagnostics.checkEnvironmentFile()'
                  ].map((command, index) => (
                    <div key={index} className="list-item">
                      <code className="text-xs text-purple-700 font-mono break-all">
                        {command}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuration Guide */}
              <div className="modern-card">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="material-icons text-orange-600">construction</span>
                  <h3 className="text-lg font-semibold text-gray-800">Configuration Guide</h3>
                </div>
                
                <div className="space-y-3">
                  {[
                    { service: 'Firebase', url: 'console.firebase.google.com', desc: 'Create project and get config' },
                    { service: 'Google Maps', url: 'console.cloud.google.com', desc: 'Enable APIs and get key' },
                    { service: 'Gemini AI', url: 'makersuite.google.com', desc: 'Generate API key' },
                    { service: 'Environment', url: '.env.local file', desc: 'Add all keys to project' }
                  ].map((item, index) => (
                    <div key={index} className="list-item">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-800">{item.service}:</span>
                          <code className="text-xs text-blue-600">{item.url}</code>
                        </div>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Running State */}
              {isRunning && (
                <div className="modern-card border-l-4 border-blue-500 bg-blue-50">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin text-2xl">⚙️</div>
                    <div>
                      <h3 className="font-semibold text-blue-800">Running Diagnostics</h3>
                      <p className="text-sm text-blue-700">Testing all service connections...</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Diagnostics; 