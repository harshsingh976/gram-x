/**
 * GRAM-X Grievance SLA & Automated Idempotent Escalation Service
 * Monitors priority deadlines and triggers automated escalations for overdue grievances.
 *
 * SLA Standards:
 * - Critical: 12h verification / 24h resolution
 * - High: 24h verification / 48h resolution
 * - Medium: 48h verification / 96h resolution
 * - Low: 72h verification / 168h resolution
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { escalateGrievance, type Grievance, type GrievancePriority } from './grievanceService';
import { createNotification } from './notificationService';

export interface GrievanceSLA {
  grievance_id: string | number;
  verification_due_at: string;
  resolution_due_at: string;
  is_escalated: boolean;
  escalated_at?: string;
  escalation_level: number;
}

export interface SLABreachCheckResult {
  checked_count: number;
  escalated_count: number;
  escalated_ids: Array<string | number>;
}

/**
 * Calculate SLA Deadlines from Priority & Creation Timestamp
 */
export const calculateSLA = (
  priority: GrievancePriority,
  createdAt: string = new Date().toISOString()
): { verificationDue: Date; resolutionDue: Date } => {
  const created = new Date(createdAt).getTime();

  let vHours = 48;
  let rHours = 96;

  if (priority === 'critical') {
    vHours = 12;
    rHours = 24;
  } else if (priority === 'high') {
    vHours = 24;
    rHours = 48;
  } else if (priority === 'low') {
    vHours = 72;
    rHours = 168;
  }

  return {
    verificationDue: new Date(created + vHours * 3600 * 1000),
    resolutionDue: new Date(created + rHours * 3600 * 1000),
  };
};

/**
 * Scheduled Idempotent Overdue Grievance Checker & Automated Escalator
 */
export const checkAndEscalateOverdueGrievances = async (
  grievanceList: Grievance[]
): Promise<SLABreachCheckResult> => {
  const now = Date.now();
  const escalatedIds: Array<string | number> = [];

  for (const g of grievanceList) {
    // 1. Skip already closed or already escalated grievances (Idempotency Guard)
    if (g.status === 'CLOSED' || g.status === 'RESOLVED' || g.status === 'ESCALATED') {
      continue;
    }

    const { verificationDue, resolutionDue } = calculateSLA(g.priority, g.created_at);

    let shouldEscalate = false;
    let breachReason = '';

    // Check Verification SLA Breach
    if (g.status === 'SUBMITTED' && now > verificationDue.getTime()) {
      shouldEscalate = true;
      breachReason = `Automated SLA Breach: Grievance unverified after ${verificationDue.toLocaleString('en-IN')}.`;
    }

    // Check Resolution SLA Breach
    if ((g.status === 'ASSIGNED' || g.status === 'IN_PROGRESS') && now > resolutionDue.getTime()) {
      shouldEscalate = true;
      breachReason = `Automated SLA Breach: Field remediation exceeded statutory resolution deadline (${resolutionDue.toLocaleString('en-IN')}).`;
    }

    if (shouldEscalate) {
      try {
        await escalateGrievance(g.id, breachReason);
        escalatedIds.push(g.id);

        // Send alert notification to Panchayat Administration
        await createNotification({
          recipient_id: 'admin',
          grievance_id: g.id,
          type: 'DEADLINE_MISSED',
          title: `SLA Breach Alert: ${g.reference_no}`,
          message: `${g.title} has exceeded statutory resolution time and is automatically escalated to District Collector.`,
          metadata: { reference_no: g.reference_no, priority: g.priority },
        });
      } catch (err) {
        console.warn(`[GRAM-X SLA] Failed to auto-escalate grievance ${g.id}:`, err);
      }
    }
  }

  return {
    checked_count: grievanceList.length,
    escalated_count: escalatedIds.length,
    escalated_ids: escalatedIds,
  };
};

export default {
  calculateSLA,
  checkAndEscalateOverdueGrievances,
};
