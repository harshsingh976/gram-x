export interface Village {
  id: number;
  name: string;
  district: string;
  state: string;
  population: number;
  budget_allocated: number;
  budget_spent: number;
  shape_geojson?: any;
}

export interface VillageMetrics {
  village_id: number;
  name: string;
  health_score: number;
  budget_allocated: number;
  budget_spent: number;
  active_incidents_count: number;
  critical_incidents_count: number;
  active_projects_count: number;
  outcome_gap_projects_count: number;
  asset_reliability_pct: number;
  resource_utilization_pct: number;
  water_reliability_pct: number;
  service_coverage_pct: number;
}

export interface SensorReading {
  id: number;
  asset_id: number;
  parameter: string;
  value: number;
  timestamp: string;
}

export interface MaintenanceHistory {
  id: number;
  date: string;
  action_taken: string;
  cost: number;
  technician_id?: number;
}

export interface Asset {
  id: number;
  name: string;
  type: string;
  category?: string;
  village_id: number;
  status: 'operational' | 'degraded' | 'broken' | 'maintenance' | 'down' | string;
  latitude: number;
  longitude: number;
  install_date: string;
  capacity?: number;
  current_utilization: number;
}

export interface AssetDetail extends Asset {
  sensor_readings: SensorReading[];
  maintenance_history: MaintenanceHistory[];
  failures_count: number;
  average_failure_interval_days?: number;
  total_maintenance_cost: number;
}

export interface IncidentEvidence {
  id: number;
  type: 'photo' | 'voice' | 'sensor';
  file_path?: string;
  recognized_text?: string;
  ai_metadata?: string; // JSON string
}

export interface Incident {
  id: number;
  title: string;
  description?: string;
  category: string;
  status: 'open' | 'reported' | 'pending_verification' | 'verified' | 'in_progress' | 'completed' | 'resolved' | 'resolved_confirmed' | 'outcome_gap' | string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'NORMAL' | 'CRITICAL' | string;
  sla_status?: string;
  reporter_name?: string;
  asset_id?: number;
  village_id: number;
  latitude: number;
  longitude: number;
  created_at: string;
  resolved_at?: string;
  ai_confidence?: number;
  affected_population?: number;
  priority_score?: number;
}

export interface IncidentDetail extends Incident {
  evidence: IncidentEvidence[];
  probable_root_causes: string[];
  consequences: string[];
  historical_failures_count: number;
}

export interface ProjectMilestone {
  id: number;
  title: string;
  target_date: string;
  status: 'pending' | 'completed';
  actual_date?: string;
}

export interface ProjectOutcome {
  id: number;
  metric_name: string;
  target_value: number;
  observed_value: number;
  verification_method: string;
  status: 'verified' | 'outcome_gap' | 'pending';
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  village_id: number;
  cost_estimate: number;
  start_date: string;
  end_date?: string;
  status: 'approved' | 'in_progress' | 'completed';
  physical_progress_pct: number;
  functional_status_pct: number;
  actual_usage_pct: number;
  outcome_verified: boolean;
  milestones: ProjectMilestone[];
  outcomes: ProjectOutcome[];
}

export interface Technician {
  id: number;
  name: string;
  specialty: 'water' | 'electrical' | 'construction' | 'sanitation';
  availability: boolean;
  current_lat: number;
  current_lng: number;
  rating: number;
  distance_km?: number;
}

export interface Task {
  id: number;
  incident_id: number;
  technician_id: number;
  description?: string;
  status: 'assigned' | 'accepted' | 'completed';
  assigned_at: string;
  completed_at?: string;
  cost: number;
  base_cost: number;
  cost_increased: boolean;
  work_done?: string;
  what_was_wrong?: string;
  product_effect?: string;
  payout_status: 'pending' | 'paid';
  payout_tx_id?: string;
}

export interface ScenarioSummary {
  label: string;
  estimated_cost: number;
  population_affected: number;
  expected_improvement_pct: number;
  predicted_future_cost: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  secondary_consequences: string[];
  resource_requirements: string[];
}

export interface WhatIfResponse {
  today: ScenarioSummary;
  delayed: ScenarioSummary;
}

export interface ReuseRecommendation {
  id: number;
  asset_name: string;
  type: string;
  current_utilization: number;
  potential_utilization: number;
  estimated_renovation_cost: number;
  estimated_benefit_description: string;
  alternative_new_construction_cost: number;
  savings: number;
}

export interface DemoStatus {
  current_step: number;
  total_steps: number;
  title: string;
  description: string;
  badge: string;
  active_incident_id?: number;
  active_task_id?: number;
  active_project_id?: number;
  last_updated: string;
}
export type UserRole = 'admin' | 'citizen' | 'worker' | 'district' | 'super_admin';
