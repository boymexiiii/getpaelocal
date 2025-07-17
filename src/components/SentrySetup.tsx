
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';

export const SentrySetup = () => {
  const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
  const isConfigured = !!sentryDsn;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Sentry Error Tracking
              {isConfigured ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Real-time error monitoring and crash reporting
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConfigured ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To enable Sentry error tracking, you need to set the <code>REACT_APP_SENTRY_DSN</code> environment variable.
              <br />
              <a 
                href="https://sentry.io/welcome/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-800"
              >
                Get your Sentry DSN <ExternalLink className="w-3 h-3" />
              </a>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Environment</span>
              <Badge variant="outline">{process.env.NODE_ENV}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">DSN Configured</span>
              <Badge variant="default">Yes</Badge>
            </div>
            <div className="text-sm text-gray-600">
              <p>Features enabled:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Error tracking and reporting</li>
                <li>Performance monitoring</li>
                <li>Session replay</li>
                <li>User context tracking</li>
                <li>Transaction monitoring</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
