import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface PageLoadingProps {
  message?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ 
  message = 'Loading page...' 
}) => {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <LoadingSpinner size="large" message={message} />
    </div>
  );
};