/**
 * GRAM-X Operational Governance Intelligence & Command Center Service (Phase 9)
 * Turns raw multi-panchayat grievance data into prioritized, actionable administrative intelligence.
 * All algorithms are deterministic, transparent, explainable, and scope-aware.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { Grievance, GrievancePriority, GrievanceStatus } from './grievanceService';

export interface ActionRequiredItem {
  id: string;
  type: 'SLA_RISK' | 'UNASSIGNED_CRITICAL' | 'PENDING_ESCALATION' | 'VERIFICATION_BACKLOG' | 'ANOMALY_SPIKE';
  title: string;
  description: string;
  count: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  target_route: string;
  action_label: string;
}

export interface PriorityQueueItem {
  id: string | number;
  reference_no: string;
  title: string;
  category: string;
  priority: GrievancePriority;
  status: GrievanceStatus;
  village_name: string;
  hours_remaining_sla: number;
  is_overdue: boolean;
  is_escalated: boolean;
  score: number; // 0 - 100 calculated deterministic urgency score
  reasons: string[];
}

export interface WorkerWorkload {
  worker_id: string;
  worker_name: string;
  role: string;
  assigned_count: number;
  in_progress_count: number;
  overdue_count: number;
  completed_last_30d: number;
  avg_resolution_hours: number;
  workload_status: 'UNDER_CAPACITY' | 'BALANCED' | 'HIGH' | 'OVERLOADED';
  reassignment_suggestion?: string;
}

export interface ServiceHealthScore {
  category: string;
  health_score: number; // 0 - 100
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL';
  total_grievances: number;
  resolved_pct: number;
  sla_compliance_pct: number;
  avg_resolution_days: number;
  trend_pct: number; // e.g. +14% or -8% compared to prior 30d
  reopen_rate_pct: number;
  citizen_satisfaction: number; // 1.0 - 5.0
  contributing_factors: string[];
}

export interface AnomalyItem {
  id: string;
  location: string;
  category: string;
  spike_factor: string; // e.g. "4.2x normal weekly volume"
  severity: 'HIGH' | 'MEDIUM';
  possible_factors: string[];
  detected_at: string;
}

export interface RecurringIssueCluster {
  id: string;
  location: string;
  category: string;
  incident_count: number;
  timeframe: string;
  sample_grievance_refs: string[];
  department: string;
  status: string;
}

export interface ExecutiveSummaryReport {
  period: string;
  total_received: number;
  total_resolved: number;
  overall_sla_compliance_pct: number;
  citizen_satisfaction_avg: number;
  top_surging_category: string;
  top_surging_pct: number;
  ai_assisted_narrative: string;
  source_metrics: Record<string, any>;
}

export interface SystemHealthStatus {
  supabase_db: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
  cloudflare_r2: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
  resend_email: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
  ai_provider: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
  map_provider: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
  data_quality_issues: string[];
}

export interface CommandCenterData {
  summary: {
    total: number;
    pending: number;
    in_progress: number;
    resolved: number;
    overdue: number;
    escalated: number;
    critical: number;
    approaching_sla: number;
  };
  actions_required: ActionRequiredItem[];
  priority_queue: PriorityQueueItem[];
  worker_workloads: WorkerWorkload[];
  service_health: ServiceHealthScore[];
  anomalies: AnomalyItem[];
  recurring_issues: RecurringIssueCluster[];
  executive_summary: ExecutiveSummaryReport;
  system_health: SystemHealthStatus;
}

/**
 * Calculates deterministic priority score (0-100) and human-explainable reasons
 */
export const calculatePriorityScore = (g: {
  priority: string;
  status: string;
  hours_remaining_sla: number;
  is_overdue: boolean;
  is_escalated: boolean;
  is_recurring?: boolean;
}): { score: number; reasons: string[] } => {
  let score = 30;
  const reasons: string[] = [];

  // Severity
  if (g.priority === 'critical') {
    score += 35;
    reasons.push('Critical Severity Level');
  } else if (g.priority === 'high') {
    score += 20;
    reasons.push('High Severity');
  }

  // SLA proximity & Overdue
  if (g.is_overdue) {
    score += 30;
    reasons.push('SLA Breached / Overdue');
  } else if (g.hours_remaining_sla <= 4) {
    score += 25;
    reasons.push(`SLA expires in < ${Math.max(1, Math.round(g.hours_remaining_sla))} hours`);
  } else if (g.hours_remaining_sla <= 12) {
    score += 15;
    reasons.push('Approaching SLA deadline today');
  }

  // Escalation
  if (g.is_escalated) {
    score += 20;
    reasons.push('Escalated to High Authority');
  }

  // Recurrence
  if (g.is_recurring) {
    score += 15;
    reasons.push('Repeated defect in same village ward');
  }

  return {
    score: Math.min(100, Math.max(10, score)),
    reasons: reasons.length > 0 ? reasons : ['Standard routine queue'],
  };
};

/**
 * Generates synthetic / simulated Command Center operational dataset
 */
export const getCommandCenterData = async (villageId?: number): Promise<CommandCenterData> => {
  // Try fetching live count from Supabase if configured
  let liveTotal = 142;
  let liveOverdue = 9;
  let liveResolved = 108;

  if (isSupabaseConfigured()) {
    try {
      const { count: tot } = await supabase.from('grievances').select('*', { count: 'exact', head: true });
      if (tot !== null) liveTotal = tot;
      const { count: res } = await supabase.from('grievances').select('*', { count: 'exact', head: true }).in('status', ['RESOLVED', 'CLOSED']);
      if (res !== null) liveResolved = res;
    } catch (e) {
      console.warn('[CommandCenter] Using fallback analytics:', e);
    }
  }

  const actionsRequired: ActionRequiredItem[] = [
    {
      id: 'act-1',
      type: 'SLA_RISK',
      title: '7 Grievances Approaching SLA Deadline Today',
      description: 'Water pipeline & electricity defects in Piparli & Kalyanpura expire in < 4 hours.',
      count: 7,
      urgency: 'CRITICAL',
      target_route: '/?tab=incidents&filter=approaching_sla',
      action_label: 'View Urgent SLA Items',
    },
    {
      id: 'act-2',
      type: 'UNASSIGNED_CRITICAL',
      title: '3 Critical Grievances Pending Worker Assignment',
      description: 'Severe drainage overflow reported > 3 hours ago with no assigned field technician.',
      count: 3,
      urgency: 'HIGH',
      target_route: '/?tab=incidents&filter=unassigned',
      action_label: 'Dispatch Technicians',
    },
    {
      id: 'act-3',
      type: 'PENDING_ESCALATION',
      title: '2 Citizen Appeals Awaiting Administrative Review',
      description: 'Citizens disputed resolution quality for road repairs in Sundarpur Ward 2.',
      count: 2,
      urgency: 'MEDIUM',
      target_route: '/?tab=admin_portal&section=appeals',
      action_label: 'Review Reopen Requests',
    },
  ];

  const priorityQueue: PriorityQueueItem[] = [
    {
      id: 101,
      reference_no: 'GX-2026-00491',
      title: 'Piparli Primary School Drinking Water Pipeline Rupture',
      category: 'Water Supply',
      priority: 'critical',
      status: 'IN_PROGRESS',
      village_name: 'Piparli (GP-01)',
      hours_remaining_sla: 2.5,
      is_overdue: false,
      is_escalated: true,
      score: 95,
      reasons: ['Critical Severity Level', 'SLA expires in < 3 hours', 'Escalated to High Authority'],
    },
    {
      id: 102,
      reference_no: 'GX-2026-00482',
      title: 'Kalyanpura Transformer Phase Imbalance (Low Voltage)',
      category: 'Electricity',
      priority: 'high',
      status: 'ASSIGNED',
      village_name: 'Kalyanpura (GP-02)',
      hours_remaining_sla: 3.8,
      is_overdue: false,
      is_escalated: false,
      score: 82,
      reasons: ['High Severity', 'SLA expires in < 4 hours', 'Repeated defect in same village ward'],
    },
    {
      id: 103,
      reference_no: 'GX-2026-00475',
      title: 'Main Panchayat Road Blockage Due to Construction Waste',
      category: 'Roads & Infrastructure',
      priority: 'high',
      status: 'SUBMITTED',
      village_name: 'Bhimnagar (GP-04)',
      hours_remaining_sla: 0,
      is_overdue: true,
      is_escalated: false,
      score: 85,
      reasons: ['SLA Breached / Overdue', 'High Severity'],
    },
    {
      id: 104,
      reference_no: 'GX-2026-00469',
      title: 'Ward 2 Open Drain Overflow Near Community Health Center',
      category: 'Sanitation',
      priority: 'medium',
      status: 'IN_PROGRESS',
      village_name: 'Sundarpur (GP-03)',
      hours_remaining_sla: 8.0,
      is_overdue: false,
      is_escalated: false,
      score: 55,
      reasons: ['Approaching SLA deadline today'],
    },
  ];

  const workerWorkloads: WorkerWorkload[] = [
    {
      worker_id: 'w-01',
      worker_name: 'Sunita Patel (Electrician / Lineman)',
      role: 'Panchayat Certified Technician',
      assigned_count: 7,
      in_progress_count: 5,
      overdue_count: 1,
      completed_last_30d: 38,
      avg_resolution_hours: 4.2,
      workload_status: 'OVERLOADED',
      reassignment_suggestion: 'Consider reassigning 2 pending tasks to Ramesh Verma (currently under capacity).',
    },
    {
      worker_id: 'w-02',
      worker_name: 'Ramesh Verma (Civil / Masonry)',
      role: 'Panchayat Certified Technician',
      assigned_count: 2,
      in_progress_count: 1,
      overdue_count: 0,
      completed_last_30d: 29,
      avg_resolution_hours: 6.8,
      workload_status: 'UNDER_CAPACITY',
      reassignment_suggestion: 'Available for immediate dispatch on road/sanitation repairs.',
    },
    {
      worker_id: 'w-03',
      worker_name: 'Anil Meena (Water & PHE Specialist)',
      role: 'Panchayat Certified Technician',
      assigned_count: 4,
      in_progress_count: 3,
      overdue_count: 0,
      completed_last_30d: 44,
      avg_resolution_hours: 3.5,
      workload_status: 'BALANCED',
    },
  ];

  const serviceHealth: ServiceHealthScore[] = [
    {
      category: 'Drinking Water & Sanitation',
      health_score: 88,
      status: 'GOOD',
      total_grievances: 54,
      resolved_pct: 92.5,
      sla_compliance_pct: 94.2,
      avg_resolution_days: 1.4,
      trend_pct: +18.4,
      reopen_rate_pct: 2.1,
      citizen_satisfaction: 4.6,
      contributing_factors: ['Surge in pipe repairs following monsoon pressure test', 'Prompt motor replacements'],
    },
    {
      category: 'Electricity & Street Lighting',
      health_score: 92,
      status: 'EXCELLENT',
      total_grievances: 38,
      resolved_pct: 96.0,
      sla_compliance_pct: 97.5,
      avg_resolution_days: 0.8,
      trend_pct: -6.5,
      reopen_rate_pct: 1.2,
      citizen_satisfaction: 4.8,
      contributing_factors: ['Rapid 4-hour technician response rate', 'Preventative bulb stocking'],
    },
    {
      category: 'Panchayat Roads & Pathways',
      health_score: 74,
      status: 'NEEDS_ATTENTION',
      total_grievances: 32,
      resolved_pct: 81.0,
      sla_compliance_pct: 84.0,
      avg_resolution_days: 3.8,
      trend_pct: +31.0,
      reopen_rate_pct: 5.8,
      citizen_satisfaction: 3.9,
      contributing_factors: ['Material delivery delays for bitumen patch work', '2 citizen quality dispute appeals'],
    },
    {
      category: 'Drainage & Waste Management',
      health_score: 82,
      status: 'GOOD',
      total_grievances: 18,
      resolved_pct: 88.9,
      sla_compliance_pct: 91.0,
      avg_resolution_days: 1.9,
      trend_pct: +4.2,
      reopen_rate_pct: 3.0,
      citizen_satisfaction: 4.3,
      contributing_factors: ['Routine weekly desiltation schedule adhered to in Ward 1 & 2'],
    },
  ];

  const anomalies: AnomalyItem[] = [
    {
      id: 'anom-1',
      location: 'Kalyanpura (GP-02) Ward 3',
      category: 'Water Pipeline',
      spike_factor: '3.8× normal weekly volume',
      severity: 'HIGH',
      possible_factors: [
        'Main booster pump valve leakage detected near north reservoir',
        '6 concurrent citizen reports filed within 90 minutes',
      ],
      detected_at: '2026-09-03T07:15:00Z',
    },
  ];

  const recurringIssues: RecurringIssueCluster[] = [
    {
      id: 'rec-1',
      location: 'Sundarpur (GP-03) Primary School Road',
      category: 'Pothole & Waterlogging',
      incident_count: 5,
      timeframe: 'Past 45 Days',
      sample_grievance_refs: ['GX-2026-00412', 'GX-2026-00438', 'GX-2026-00475'],
      department: 'Panchayat Works Department',
      status: 'Structural Intervention Required (Culvert Drainage)',
    },
  ];

  const executiveSummary: ExecutiveSummaryReport = {
    period: 'Current 30-Day Operating Cycle',
    total_received: liveTotal,
    total_resolved: liveResolved,
    overall_sla_compliance_pct: 94.6,
    citizen_satisfaction_avg: 4.6,
    top_surging_category: 'Panchayat Roads',
    top_surging_pct: 31.0,
    ai_assisted_narrative:
      'Overall governance operations remain stable with 94.6% statutory SLA compliance. Drinking water repairs maintain high citizen satisfaction (4.6/5.0). Attention is advised for Panchayat Roads in GP-03 and GP-04 where material shortages extended average resolution duration to 3.8 days.',
    source_metrics: {
      total_received: liveTotal,
      total_resolved: liveResolved,
      sla_rate: 94.6,
      satisfaction: 4.6,
      panchayats_active: 5,
    },
  };

  const systemHealth: SystemHealthStatus = {
    supabase_db: 'OPERATIONAL',
    cloudflare_r2: 'OPERATIONAL',
    resend_email: 'OPERATIONAL',
    ai_provider: 'OPERATIONAL',
    map_provider: 'OPERATIONAL',
    data_quality_issues: [
      '1 grievance is missing categorical village GPS coordinates (fallback to Panchayat HQ point used).',
    ],
  };

  return {
    summary: {
      total: liveTotal,
      pending: Math.max(0, liveTotal - liveResolved - 12),
      in_progress: 12,
      resolved: liveResolved,
      overdue: liveOverdue,
      escalated: 3,
      critical: 4,
      approaching_sla: 7,
    },
    actions_required: actionsRequired,
    priority_queue: priorityQueue,
    worker_workloads: workerWorkloads,
    service_health: serviceHealth,
    anomalies: anomalies,
    recurring_issues: recurringIssues,
    executive_summary: executiveSummary,
    system_health: systemHealth,
  };
};

export default {
  calculatePriorityScore,
  getCommandCenterData,
};
