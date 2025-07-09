import { Component, ErrorInfo, ReactNode, ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with error tracking services here
      // e.g., Sentry, LogRocket, etc.
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
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
        <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center p-4">
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-xl font-semibold">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                We're sorry, but something unexpected happened. Please try again or go back to the home page.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm">
                  <div className="font-medium text-red-800 mb-2">Error Details:</div>
                  <div className="text-red-700 font-mono text-xs break-all">
                    {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div className="text-red-700 font-mono text-xs mt-2 break-all">
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for functional components
export function withErrorBoundary<T extends object>(
  Component: ComponentType<T>,
  fallback?: ReactNode
) {
  const ComponentWithErrorBoundary = function(props: T) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
  
  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  
  return ComponentWithErrorBoundary;
}