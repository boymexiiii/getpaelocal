
import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from "@sentry/react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { captureException, addBreadcrumb } from '@/utils/sentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Add breadcrumb for error context
    addBreadcrumb(
      `Error boundary caught: ${error.message}`,
      'error',
      'error'
    );
    
    // Capture exception with Sentry
    const errorId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
    
    this.setState({
      error,
      errorInfo,
      errorId: errorId || null
    });
  }

  handleReload = () => {
    addBreadcrumb('User clicked reload after error', 'user', 'info');
    window.location.reload();
  };

  handleGoHome = () => {
    addBreadcrumb('User navigated home after error', 'user', 'info');
    window.location.href = '/';
  };

  handleReportFeedback = () => {
    if (this.state.errorId) {
      Sentry.showReportDialog({ eventId: this.state.errorId });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                We're sorry, but something unexpected happened. Our team has been automatically notified and will look into this issue.
              </p>
              
              {this.state.errorId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 text-center">
                    Error ID: <code className="font-mono">{this.state.errorId}</code>
                  </p>
                </div>
              )}
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Error Details:</h4>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
                    {this.state.error.message}
                  </pre>
                </div>
              )}
              
              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-3">
                  <Button 
                    onClick={this.handleReload}
                    className="flex-1"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button 
                    onClick={this.handleGoHome}
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>
                {this.state.errorId && (
                  <Button 
                    onClick={this.handleReportFeedback}
                    variant="outline"
                    size="sm"
                  >
                    Report Feedback
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create a Sentry-wrapped version for additional features
export const SentryErrorBoundary = Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: ({ error, resetError }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="text-center p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Application Error</h2>
          <p className="text-gray-600 mb-4">Something went wrong. Please try refreshing the page.</p>
          <Button onClick={resetError}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  ),
  beforeCapture: (scope) => {
    scope.setTag("errorBoundary", true);
  },
});
