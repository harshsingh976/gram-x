/**
 * GRAM-X Privacy-First Product Analytics & Funnel Tracker (Phase 8)
 * Measures real citizen & official product interactions while strictly protecting privacy.
 * Never collects or logs passwords, auth tokens, citizen PII, or full grievance bodies.
 */

export type AnalyticsEventType =
  | 'landing_view'
  | 'language_changed'
  | 'registration_started'
  | 'registration_completed'
  | 'login_success'
  | 'login_failed'
  | 'grievance_started'
  | 'grievance_submitted'
  | 'attachment_added'
  | 'grievance_viewed'
  | 'grievance_tracked'
  | 'feedback_submitted'
  | 'reopen_requested'
  | 'notification_opened'
  | 'search_used'
  | 'filter_used'
  | 'assignment_completed'
  | 'status_updated'
  | 'grievance_resolved'
  | 'escalation_created'
  | 'report_exported'
  | 'pilot_feedback_given';

export interface AnalyticsEvent {
  event: AnalyticsEventType;
  userId?: string;
  role?: string;
  language?: string;
  properties?: Record<string, any>;
  timestamp: string;
}

// In-memory buffer for local session analytics
const eventBuffer: AnalyticsEvent[] = [];
const MAX_BUFFER_SIZE = 500;

/**
 * Sanitizes metadata to ensure zero PII or credentials are tracked.
 */
const sanitizeProperties = (props?: Record<string, any>): Record<string, any> => {
  if (!props) return {};
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(props)) {
    // Drop sensitive fields
    if (/password|secret|token|auth|bearer|cookie|description|attachment|address|phone|email/i.test(k)) {
      continue;
    }
    // Only accept primitives or safe enum values
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      clean[k] = v;
    }
  }
  return clean;
};

/**
 * Track an analytics event
 */
export const trackEvent = (
  event: AnalyticsEventType,
  properties?: Record<string, any>,
  role?: string
): void => {
  const lang = typeof localStorage !== 'undefined' ? localStorage.getItem('gramx_language') || 'hi' : 'hi';
  const cleanProps = sanitizeProperties(properties);

  const analyticsEvent: AnalyticsEvent = {
    event,
    role,
    language: lang,
    properties: cleanProps,
    timestamp: new Date().toISOString(),
  };

  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    eventBuffer.shift();
  }
  eventBuffer.push(analyticsEvent);

  if (import.meta.env.DEV) {
    console.info(`[ProductAnalytics:${event}]`, cleanProps);
  }
};

/**
 * Calculate Citizen Grievance Funnel Metrics
 */
export const getCitizenFunnelSummary = (): {
  started: number;
  submitted: number;
  tracked: number;
  feedbackGiven: number;
  completionRate: number;
} => {
  const started = eventBuffer.filter((e) => e.event === 'grievance_started').length;
  const submitted = eventBuffer.filter((e) => e.event === 'grievance_submitted').length;
  const tracked = eventBuffer.filter((e) => e.event === 'grievance_tracked').length;
  const feedbackGiven = eventBuffer.filter((e) => e.event === 'feedback_submitted').length;

  const completionRate = started > 0 ? Math.round((submitted / started) * 100) : 100;

  return {
    started,
    submitted,
    tracked,
    feedbackGiven,
    completionRate,
  };
};

/**
 * Get recent sanitized event log
 */
export const getRecentEvents = (limit: number = 50): AnalyticsEvent[] => {
  return eventBuffer.slice(-limit);
};

export default {
  trackEvent,
  getCitizenFunnelSummary,
  getRecentEvents,
};
