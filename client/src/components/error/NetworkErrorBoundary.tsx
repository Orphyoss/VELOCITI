import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  isOnline: boolean;
}

export class NetworkErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isOnline: navigator.onLine,
    };
  }

  componentDidMount() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = () => {
    this.setState({ isOnline: true });
    // Auto-retry when coming back online
    if (this.state.hasError && this.retryCount < this.maxRetries) {
      setTimeout(() => this.handleRetry(), 1000);
    }
  };

  handleOffline = () => {
    this.setState({ isOnline: false });
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if it's a network-related error
    const isNetworkError = 
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED');

    if (isNetworkError) {
      return {
        hasError: true,
        error,
      };
    }

    // For non-network errors, don't catch them
    return {};
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[NetworkErrorBoundary] Caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.retryCount++;
    console.log(`[NetworkErrorBoundary] Retry attempt ${this.retryCount}/${this.maxRetries}`);
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, isOnline } = this.state;
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="p-6 space-y-4">
          <Alert variant="destructive">
            <div className="flex items-center space-x-2">
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <AlertTitle>
                {isOnline ? 'Network Error' : 'Connection Lost'}
              </AlertTitle>
            </div>
            <AlertDescription>
              {!isOnline 
                ? 'Your internet connection appears to be offline. Please check your network connection.'
                : error?.message.includes('timeout')
                ? 'The request timed out. The server may be experiencing high load.'
                : error?.message.includes('Failed to fetch')
                ? 'Unable to connect to the server. This may be a temporary issue.'
                : `Network error: ${error?.message || 'Unknown error'}`
              }
            </AlertDescription>
          </Alert>

          {canRetry && (
            <div className="flex justify-center">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry ({this.maxRetries - this.retryCount} attempts left)</span>
              </Button>
            </div>
          )}

          {!canRetry && (
            <div className="text-center text-sm text-muted-foreground">
              Maximum retry attempts reached. Please refresh the page or contact support if the issue persists.
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}