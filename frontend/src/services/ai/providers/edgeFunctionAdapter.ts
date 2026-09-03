/**
 * GRAM-X Supabase Edge Function AI Provider Adapter
 * Connects to server-side Edge Functions holding private LLM API keys (Gemini / Groq / OpenRouter).
 * Transparently falls back to ruleBasedAdapter if the Edge Function is unconfigured or unavailable.
 */

import { supabase, isSupabaseConfigured } from '../../supabase';
import type {
  AIProviderAdapter,
  AIClassificationInput,
  AIAnalysisResult,
  SimilarityMatch,
  AIInsightMetric,
} from '../types';
import { ruleBasedAdapter } from './ruleBasedAdapter';

export const edgeFunctionAdapter: AIProviderAdapter = {
  name: 'supabase-edge-llm',

  async classifyAndPrioritize(input: AIClassificationInput): Promise<AIAnalysisResult> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.functions.invoke('analyze-grievance', {
          body: {
            action: 'classify',
            title: input.title,
            description: input.description,
            location: input.location_address,
          },
        });

        if (!error && data && data.suggested_category) {
          return {
            suggested_category: data.suggested_category,
            suggested_priority: data.suggested_priority || 'medium',
            suggested_department: data.suggested_department || 'Panchayat Engineering',
            confidence_score: data.confidence_score || 0.90,
            summary: data.summary || `${input.title}: ${input.description.slice(0, 100)}...`,
            tags: data.tags || [data.suggested_category],
            model_name: data.model_name || 'supabase-edge-gemini-1.5-flash',
            explanation: data.explanation || 'Analyzed via server-side generative triage model.',
          };
        }
      } catch (err) {
        console.info('[GRAM-X AI] Edge function fallback:', err);
      }
    }

    // Transparent offline heuristic fallback
    return ruleBasedAdapter.classifyAndPrioritize(input);
  },

  async summarize(text: string): Promise<string> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.functions.invoke('analyze-grievance', {
          body: { action: 'summarize', text },
        });
        if (!error && data?.summary) return data.summary;
      } catch {}
    }
    return ruleBasedAdapter.summarize(text);
  },

  async findSimilar(newTitle: string, newDesc: string, existingList: any[]): Promise<SimilarityMatch[]> {
    return ruleBasedAdapter.findSimilar(newTitle, newDesc, existingList);
  },

  async generateInsights(metrics: Record<string, any>): Promise<AIInsightMetric[]> {
    return ruleBasedAdapter.generateInsights(metrics);
  },
};

export default edgeFunctionAdapter;
