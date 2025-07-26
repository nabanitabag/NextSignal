import React from 'react';

const TestPage = () => {
  console.log('🧪 TestPage: Rendering simple test page...');
  
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🎉 NextSignal Test Page
        </h1>
        <p className="text-gray-600 mb-4">
          If you can see this, the basic React app is working!
        </p>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ App is successfully rendering
        </div>
        <div className="mt-6">
          <p className="text-sm text-gray-500">
            Check the browser console for detailed logs
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestPage; 