
import * as Sentry from "@sentry/react";

export const initSentry = () => {
  // Only initialize Sentry if DSN is provided
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.log("Sentry DSN not configured, skipping initialization");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "development",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Configure error filtering
    beforeSend(event, hint) {
      // Filter out development errors
      if (import.meta.env.MODE === "development") {
        console.log("Sentry Event:", event);
      }
      return event;
    },
  });
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext("additional_info", context);
    }
    Sentry.captureException(error);
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = "info") => {
  Sentry.captureMessage(message, level);
};

export const setUserContext = (user: { id: string; email: string; name?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
};

export const addBreadcrumb = (message: string, category: string, level: Sentry.SeverityLevel = "info") => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};
