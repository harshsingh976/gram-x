/**
 * GRAM-X AI Service Types & Interfaces
 */

import type { GrievanceCategory, GrievancePriority } from '../grievanceService';

export interface AIClassificationInput {
  title: string;
  description: string;
  location_address?: string;
  category?: GrievanceCategory;
}

export interface AIAnalysisResult {
  suggested_category: GrievanceCategory;
  suggested_priority: GrievancePriority;
  suggested_department: string;
  confidence_score: number; // 0.0 - 1.0
  summary: string;
  tags: string[];
  model_name: string;
  explanation: string;
}

export interface SimilarityMatch {
  grievance_id: string | number;
  reference_no: string;
  title: string;
  similarity_score: number; // 0.0 - 1.0
  category: GrievanceCategory;
  status: string;
}

export interface AIInsightMetric {
  id: string;
  title: string;
  value: string | number;
  trend?: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  description: string;
  based_on_metric: string;
}

export interface AIProviderAdapter {
  name: string;
  classifyAndPrioritize(input: AIClassificationInput): Promise<AIAnalysisResult>;
  summarize(text: string): Promise<string>;
  findSimilar(newTitle: string, newDesc: string, existingList: any[]): Promise<SimilarityMatch[]>;
  generateInsights(metrics: Record<string, any>): Promise<AIInsightMetric[]>;
}
