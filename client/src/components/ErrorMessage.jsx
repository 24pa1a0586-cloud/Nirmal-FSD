import React from 'react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
      <div className="w-12 h-12 mx-auto bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-xl mb-3">
        !
      </div>
      <h3 className="text-base font-semibold text-red-900 mb-1">Unable to Load Data</h3>
      <p className="text-sm text-red-700 mb-4">
        {message || 'An unexpected error occurred while communicating with the server.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
