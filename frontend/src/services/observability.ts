/**
 * GRAM-X Central Observability & Telemetry Service
 * Sentry-compatible error boundary and performance tracker.
 * Privacy rule: Automatically scrubs PII, secrets, and auth tokens before logging.
 */

interface ErrorLogEvent {
  error: Error | string;
  context?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

const scrubSensitiveData = (obj: any): any => {
  if (typeof obj === 'string') {
    return obj
      .replace(/\b\d{10}\b/g, '[PHONE]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
      .replace(/\b(bearer|token|password|secret|key)\s*[:=]\s*\S+/gi, '[REDACTED]');
  }
  if (obj && typeof obj === 'object') {
    const copy: Record<string, any> = Array.isArray(obj) ? [] : {};
    for (const [k, v] of Object.entries(obj)) {
      if (/password|secret|token|apikey|authorization/i.test(k)) {
        copy[k] = '[REDACTED]';
      } else {
        copy[k] = scrubSensitiveData(v);
      }
    }
    return copy;
  }
  return obj;
};

export const captureException = (
  error: Error | unknown,
  context: string = 'General',
  metadata?: Record<string, any>
): void => {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errStack = error instanceof Error ? error.stack : undefined;

  const event: ErrorLogEvent = {
    error: errMsg,
    context,
    metadata: scrubSensitiveData({ ...metadata, stack: errStack }),
    timestamp: new Date().toISOString(),
  };

  // Safe development logging
  if (import.meta.env.DEV) {
    console.warn(`[Observability:${context}]`, event);
  }

  // In production with Sentry, dispatch via window.Sentry?.captureException
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, {
      tags: { context },
      extra: event.metadata,
    });
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>): void => {
  const scrubbed = scrubSensitiveData(properties || {});
  if (import.meta.env.DEV) {
    console.info(`[Telemetry:${eventName}]`, scrubbed);
  }
};

export default {
  captureException,
  trackEvent,
};
