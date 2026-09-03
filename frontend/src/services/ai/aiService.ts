/**
 * GRAM-X Central AI Service
 * Provider-agnostic abstraction layer for grievance classification, priority recommendations,
 * summarization, duplicate detection, and dashboard insights.
 *
 * Privacy & Security:
 * - Sanitizes untrusted user inputs (stripping PII/tokens) before analysis.
 * - Never exposes API keys in frontend client bundles.
 * - Non-blocking: AI failures never interrupt core grievance workflows.
 */

import { edgeFunctionAdapter } from './providers/edgeFunctionAdapter';
import { ruleBasedAdapter } from './providers/ruleBasedAdapter';
import type {
  AIClassificationInput,
  AIAnalysisResult,
  SimilarityMatch,
  AIInsightMetric,
  AIProviderAdapter,
} from './types';
import type { GrievancePriority } from '../grievanceService';

let activeProvider: AIProviderAdapter = edgeFunctionAdapter;

export const setAIProvider = (provider: AIProviderAdapter) => {
  activeProvider = provider;
};

/**
 * Strips potential PII (phone numbers, email tokens) from text before sending to AI
 */
const sanitizeInputText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\b\d{10}\b/g, '[PHONE]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    .replace(/\b(password|secret|key)\s*[:=]\s*\S+/gi, '[REDACTED]');
};

/**
 * Classify a Grievance & Recommend Priority/Department
 */
export const classifyGrievance = async (
  input: AIClassificationInput
): Promise<AIAnalysisResult> => {
  const sanitizedInput: AIClassificationInput = {
    title: sanitizeInputText(input.title),
    description: sanitizeInputText(input.description),
    location_address: input.location_address,
    category: input.category,
  };

  try {
    return await activeProvider.classifyAndPrioritize(sanitizedInput);
  } catch (err) {
    console.warn('[GRAM-X AI] Primary provider failed, using rule-based fallback:', err);
    return await ruleBasedAdapter.classifyAndPrioritize(sanitizedInput);
  }
};

/**
 * Recommend Priority for a Grievance
 */
export const recommendPriority = async (text: string): Promise<GrievancePriority> => {
  const result = await classifyGrievance({
    title: 'Priority check',
    description: text,
  });
  return result.suggested_priority;
};

/**
 * Generate a Concise Factual Summary
 */
export const summarizeGrievance = async (text: string): Promise<string> => {
  const sanitized = sanitizeInputText(text);
  try {
    return await activeProvider.summarize(sanitized);
  } catch (err) {
    return ruleBasedAdapter.summarize(sanitized);
  }
};

/**
 * Find Similar or Potential Duplicate Grievances
 */
export const findSimilarGrievances = async (
  newTitle: string,
  newDescription: string,
  existingGrievances: any[]
): Promise<SimilarityMatch[]> => {
  return await activeProvider.findSimilar(newTitle, newDescription, existingGrievances);
};

/**
 * Generate Authority Dashboard AI Insights based on Real Database Metrics
 */
export const generateDashboardInsights = async (
  metrics: Record<string, any>
): Promise<AIInsightMetric[]> => {
  return await activeProvider.generateInsights(metrics);
};

export default {
  classifyGrievance,
  recommendPriority,
  summarizeGrievance,
  findSimilarGrievances,
  generateDashboardInsights,
  setAIProvider,
};
