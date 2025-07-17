
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { captureException, addBreadcrumb } from '@/utils/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EnhancedErrorBoundary caught an error:', error, errorInfo);
    
    // Add breadcrumb for error context
    addBreadcrumb(
      `Error boundary caught: ${error.message}`,
      'error',
      'error'
    );
    
    // Capture exception with enhanced context
    captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        app: {
          retryCount: this.state.retryCount,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
      },
      tags: {
        errorBoundary: true,
        component: 'EnhancedErrorBoundary',
      },
    });
    
    // Generate a simple error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      addBreadcrumb('User retried after error', 'user', 'info');
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: this.state.retryCount + 1
      });
    } else {
      // Max retries reached, reload the page
      window.location.reload();
    }
  };

  handleReload = () => {
    addBreadcrumb('User reloaded after error', 'user', 'info');
    window.location.reload();
  };

  handleGoHome = () => {
    addBreadcrumb('User navigated home after error', 'user', 'info');
    window.location.href = '/';
  };

  handleReportIssue = () => {
    addBreadcrumb('User requested to report issue', 'user', 'info');
    // You can integrate with your support system here
    const subject = `Error Report: ${this.state.error?.message}`;
    const body = `Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}`;
    
    const mailtoLink = `mailto:support@pae.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                {canRetry ? 'Something went wrong' : 'Persistent Error'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                {canRetry 
                  ? "We're sorry, but something unexpected happened. You can try again or go back to the homepage."
                  : "We've encountered multiple errors. Please reload the page or contact support."
                }
              </p>
              
              {this.state.errorId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 text-center">
                    Error ID: <code className="font-mono text-xs">{this.state.errorId}</code>
                  </p>
                </div>
              )}

              {this.state.retryCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 text-center">
                    Retry attempt: {this.state.retryCount}/{this.maxRetries}
                  </p>
                </div>
              )}
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Error Details:</h4>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                    {this.state.error.message}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  {canRetry ? (
                    <Button 
                      onClick={this.handleRetry}
                      className="flex-1"
                      variant="outline"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again ({this.maxRetries - this.state.retryCount} left)
                    </Button>
                  ) : (
                    <Button 
                      onClick={this.handleReload}
                      className="flex-1"
                      variant="outline"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reload Page
                    </Button>
                  )}
                  <Button 
                    onClick={this.handleGoHome}
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>
                
                <Button 
                  onClick={this.handleReportIssue}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report Issue
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
