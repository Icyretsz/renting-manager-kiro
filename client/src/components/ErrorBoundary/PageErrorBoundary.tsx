import React from 'react';
import { Result, Button } from 'antd';
import { ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageErrorBoundaryProps } from '@/types';
import { ErrorBoundary } from './ErrorBoundary';

const PageErrorFallback: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <Result
        status="error"
        title="Page Error"
        subTitle="This page encountered an error. Please try again."
        extra={[
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={() => window.location.reload()}
            key="reload"
          >
            Reload
          </Button>,
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            key="back"
          >
            Go Back
          </Button>,
        ]}
      />
    </div>
  );
};

export const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary fallback={<PageErrorFallback />}>
      {children}
    </ErrorBoundary>
  );
};