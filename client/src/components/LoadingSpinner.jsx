import React from 'react';

export default function LoadingSpinner({ message = 'Loading products...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-medium text-gray-600">{message}</p>
    </div>
  );
}
