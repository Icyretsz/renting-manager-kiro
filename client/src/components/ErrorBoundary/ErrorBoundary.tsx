import { Component, ErrorInfo } from 'react';
import { Result, Button } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { ErrorBoundaryProps, ErrorBoundaryState } from '@/types';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Here you could send error to logging service
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Result
            status="500"
            title="Something went wrong"
            subTitle="We're sorry, but something unexpected happened. Please try refreshing the page."
            extra={[
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={this.handleReload}
                key="reload"
              >
                Reload Page
              </Button>,
              <Button 
                icon={<HomeOutlined />} 
                onClick={this.handleGoHome}
                key="home"
              >
                Go Home
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}