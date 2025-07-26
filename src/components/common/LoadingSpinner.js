import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...', className = '' }) => {
  console.log('⏳ LoadingSpinner: Rendering with', { size, text, className });
  
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-3 border-gray-300 border-t-3 border-t-blue-500 rounded-full animate-spin`}
        style={{
          animation: 'spin 1s linear infinite'
        }}
      ></div>
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .border-3 {
          border-width: 3px;
        }
        .border-t-3 {
          border-top-width: 3px;
        }
        .w-4 { width: 1rem; }
        .h-4 { height: 1rem; }
        .w-8 { width: 2rem; }
        .h-8 { height: 2rem; }
        .w-12 { width: 3rem; }
        .h-12 { height: 3rem; }
      `}</style>
    </div>
  );
};

export default LoadingSpinner; 