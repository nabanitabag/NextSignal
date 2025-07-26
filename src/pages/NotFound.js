import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-6">🏙️</div>
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="btn btn-primary btn-lg inline-flex items-center space-x-2"
          >
            <span className="material-icons">dashboard</span>
            <span>Go to Dashboard</span>
          </Link>
          
          <div className="flex justify-center space-x-4 mt-4">
            <Link
              to="/report"
              className="btn btn-secondary flex items-center space-x-2"
            >
              <span>📍</span>
              <span>Submit Report</span>
            </Link>
            
            <Link
              to="/analytics"
              className="btn btn-secondary flex items-center space-x-2"
            >
              <span>📊</span>
              <span>View Analytics</span>
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-sm text-gray-400">
          <p>Need help? Contact support or check our documentation.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 