/**
 * GRAM-X Grievance Management Service (Supabase PostgreSQL + RLS Target Architecture)
 * Handles full grievance lifecycle: Submission, Verification, Assignment, Field Updates, Resolution, & Escalation.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { uploadEvidenceFile, getAssetPublicUrl } from './storage';

export type GrievanceStatus =
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ESCALATED';

export type GrievanceCategory =
  | 'water'
  | 'electricity'
  | 'roads'
  | 'sanitation'
  | 'infrastructure'
  | 'other';

export type GrievancePriority = 'low' | 'medium' | 'high' | 'critical';

export interface Grievance {
  id: string | number;
  reference_no: string;
  citizen_id?: string;
  reporter_name?: string;
  title: string;
  description: string;
  category: GrievanceCategory;
  priority: GrievancePriority;
  status: GrievanceStatus;
  village_id: number;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  assigned_worker_id?: string;
  assigned_worker_name?: string;
  resolution_notes?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  updates?: GrievanceUpdate[];
  assignments?: GrievanceAssignment[];
  attachments?: GrievanceAttachment[];
}

export interface GrievanceUpdate {
  id: string;
  grievance_id: string | number;
  actor_id?: string;
  actor_name: string;
  actor_role: string;
  old_status?: GrievanceStatus;
  new_status?: GrievanceStatus;
  message: string;
  created_at: string;
}

export interface GrievanceAssignment {
  id: string;
  grievance_id: string | number;
  worker_id: string;
  worker_name?: string;
  assigned_by?: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  notes?: string;
  assigned_at: string;
  completed_at?: string;
}

export interface GrievanceEscalation {
  id: string;
  grievance_id: string | number;
  escalated_by?: string;
  reason: string;
  from_authority: string;
  to_authority: string;
  status: 'PENDING' | 'REVIEWED' | 'ACTIONED' | 'RESOLVED';
  collector_directive?: string;
  created_at: string;
  resolved_at?: string;
}

export interface GrievanceAttachment {
  id: string;
  grievance_id: string | number;
  file_name: string;
  file_type: string;
  file_size: number;
  object_key: string;
  public_url: string;
  created_at: string;
}

export interface CreateGrievanceInput {
  title: string;
  description: string;
  category: GrievanceCategory;
  priority?: GrievancePriority;
  village_id?: number;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  attachmentFile?: File;
}

// ─── LOCAL DEMO IN-MEMORY STORE (ACTIVE WHEN SUPABASE IS UNCONFIGURED) ─────
let DEMO_GRIEVANCE_COUNTER = 1001;
const DEMO_GRIEVANCES: Grievance[] = [
  {
    id: 1,
    reference_no: 'GX-2026-000001',
    title: 'Broken Handpump in Ward 4',
    description: 'Community handpump near primary school has low pressure and leaks muddy water.',
    category: 'water',
    priority: 'high',
    status: 'IN_PROGRESS',
    village_id: 1,
    reporter_name: 'Sunita Devi',
    location_address: 'Ward 4, Near Primary School, Piparli',
    location_lat: 23.2851,
    location_lng: 77.4523,
    assigned_worker_id: 'demo_worker_001',
    assigned_worker_name: 'Suresh Kumar (Plumber)',
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    updates: [
      {
        id: 'u1',
        grievance_id: 1,
        actor_name: 'Sunita Devi',
        actor_role: 'Citizen',
        new_status: 'SUBMITTED',
        message: 'Grievance submitted by citizen with location coordinates.',
        created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
      },
      {
        id: 'u2',
        grievance_id: 1,
        actor_name: 'Rajesh Kumar',
        actor_role: 'Panchayat Secretary',
        old_status: 'SUBMITTED',
        new_status: 'VERIFIED',
        message: 'Verified on-site necessity during morning inspection.',
        created_at: new Date(Date.now() - 3600 * 1000 * 36).toISOString(),
      },
      {
        id: 'u3',
        grievance_id: 1,
        actor_name: 'Rajesh Kumar',
        actor_role: 'Panchayat Secretary',
        old_status: 'VERIFIED',
        new_status: 'ASSIGNED',
        message: 'Assigned to Suresh Kumar (Specialty: Water/Plumbing).',
        created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      },
      {
        id: 'u4',
        grievance_id: 1,
        actor_name: 'Suresh Kumar',
        actor_role: 'Field Worker',
        old_status: 'ASSIGNED',
        new_status: 'IN_PROGRESS',
        message: 'Field technician arrived on site; replacement washer ordered from block inventory.',
        created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
      },
    ],
  },
  {
    id: 2,
    reference_no: 'GX-2026-000002',
    title: 'Streetlight Inverter Malfunction',
    description: 'Solar streetlight at Panchayat Bhavan chowk flickers and shuts down after 8 PM.',
    category: 'electricity',
    priority: 'medium',
    status: 'VERIFIED',
    village_id: 1,
    reporter_name: 'Ram Charan',
    location_address: 'Panchayat Bhavan Chowk, Piparli',
    location_lat: 23.2842,
    location_lng: 77.4518,
    created_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    updates: [
      {
        id: 'u5',
        grievance_id: 2,
        actor_name: 'Ram Charan',
        actor_role: 'Citizen',
        new_status: 'SUBMITTED',
        message: 'Grievance submitted by citizen.',
        created_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
      },
      {
        id: 'u6',
        grievance_id: 2,
        actor_name: 'Rajesh Kumar',
        actor_role: 'Panchayat Secretary',
        old_status: 'SUBMITTED',
        new_status: 'VERIFIED',
        message: 'Verified by Panchayat Admin.',
        created_at: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
      },
    ],
  },
  {
    id: 3,
    reference_no: 'GX-2026-000003',
    title: 'Monsoon Culvert Blockage on Main Road',
    description: 'Culvert drainage blocked by silt and debris, causing water accumulation on connecting road.',
    category: 'roads',
    priority: 'critical',
    status: 'SUBMITTED',
    village_id: 1,
    reporter_name: 'Sunita Devi',
    location_address: 'Main Approach Road KM 2, Piparli',
    location_lat: 23.2865,
    location_lng: 77.4539,
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    updates: [
      {
        id: 'u7',
        grievance_id: 3,
        actor_name: 'Sunita Devi',
        actor_role: 'Citizen',
        new_status: 'SUBMITTED',
        message: 'Report logged by citizen with critical severity flag.',
        created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      },
    ],
  },
];

// ─── SERVICE METHODS ──────────────────────────────────────────────────────

/**
 * Submit a new Grievance
 */
export const submitGrievance = async (input: CreateGrievanceInput): Promise<Grievance> => {
  let attachmentMetadata: GrievanceAttachment | null = null;
  if (input.attachmentFile) {
    const uploadRes = await uploadEvidenceFile(input.attachmentFile);
    attachmentMetadata = {
      id: `att_${Date.now()}`,
      grievance_id: 0,
      file_name: input.attachmentFile.name,
      file_type: input.attachmentFile.type,
      file_size: input.attachmentFile.size,
      object_key: uploadRes.key,
      public_url: uploadRes.url,
      created_at: new Date().toISOString(),
    };
  }

  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to submit a grievance.');

    // 1. Insert Grievance
    const { data: grievance, error: gErr } = await supabase
      .from('grievances')
      .insert({
        citizen_id: user.id,
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        priority: input.priority || 'medium',
        village_id: input.village_id || 1,
        location_address: input.location_address || 'Panchayat Ward Area',
        location_lat: input.location_lat || 23.2845,
        location_lng: input.location_lng || 77.4521,
      })
      .select('*')
      .single();

    if (gErr || !grievance) {
      throw new Error(gErr?.message || 'Failed to submit grievance to Supabase.');
    }

    // 2. Insert initial timeline update
    const actorName = user.user_metadata?.name || user.email?.split('@')[0] || 'Citizen';
    await supabase.from('grievance_updates').insert({
      grievance_id: grievance.id,
      actor_id: user.id,
      actor_name: actorName,
      actor_role: 'Citizen',
      new_status: 'SUBMITTED',
      message: 'Grievance submitted by citizen via GRAM-X Citizen Portal.',
    });

    // 3. Attach evidence if present
    if (attachmentMetadata) {
      await supabase.from('grievance_attachments').insert({
        grievance_id: grievance.id,
        uploaded_by: user.id,
        file_name: attachmentMetadata.file_name,
        file_type: attachmentMetadata.file_type,
        file_size: attachmentMetadata.file_size,
        object_key: attachmentMetadata.object_key,
        public_url: attachmentMetadata.public_url,
      });
    }

    return await getGrievanceById(grievance.id);
  }

  // Demo Fallback
  DEMO_GRIEVANCE_COUNTER++;
  const refNo = `GX-2026-${String(DEMO_GRIEVANCE_COUNTER).padStart(6, '0')}`;
  const newGrievance: Grievance = {
    id: DEMO_GRIEVANCE_COUNTER,
    reference_no: refNo,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    priority: input.priority || 'medium',
    status: 'SUBMITTED',
    village_id: input.village_id || 1,
    reporter_name: typeof localStorage !== 'undefined' ? localStorage.getItem('fullName') || 'Citizen' : 'Citizen',
    location_address: input.location_address || 'Panchayat Ward Area',
    location_lat: input.location_lat || 23.2845,
    location_lng: input.location_lng || 77.4521,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    updates: [
      {
        id: `u_${Date.now()}`,
        grievance_id: DEMO_GRIEVANCE_COUNTER,
        actor_name: typeof localStorage !== 'undefined' ? localStorage.getItem('fullName') || 'Citizen' : 'Citizen',
        actor_role: 'Citizen',
        new_status: 'SUBMITTED',
        message: 'Grievance submitted by citizen with location coordinates.',
        created_at: new Date().toISOString(),
      },
    ],
    attachments: attachmentMetadata ? [attachmentMetadata] : [],
  };

  DEMO_GRIEVANCES.unshift(newGrievance);
  return newGrievance;
};

/**
 * Get Citizen's own Grievances (Enforced by Supabase RLS)
 */
export const getMyGrievances = async (): Promise<Grievance[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('grievances')
      .select('*, updates:grievance_updates(*), attachments:grievance_attachments(*)')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Failed to load your grievances.');
    }
    return (data || []) as Grievance[];
  }

  // Return demo grievances
  return [...DEMO_GRIEVANCES];
};

/**
 * Get Grievances for Panchayat Admin / District Collector
 */
export const getGrievancesByJurisdiction = async (villageId?: number): Promise<Grievance[]> => {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from('grievances')
      .select('*, updates:grievance_updates(*), assignments:grievance_assignments(*), attachments:grievance_attachments(*)')
      .order('created_at', { ascending: false });

    if (villageId) {
      query = query.eq('village_id', villageId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Failed to fetch jurisdiction grievances.');
    return (data || []) as Grievance[];
  }

  if (villageId) {
    return DEMO_GRIEVANCES.filter((g) => g.village_id === villageId);
  }
  return [...DEMO_GRIEVANCES];
};

/**
 * Get Grievances Assigned to a Field Worker
 */
export const getAssignedGrievances = async (workerId?: string): Promise<Grievance[]> => {
  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();
    const effectiveWorkerId = workerId || user?.id;

    const { data, error } = await supabase
      .from('grievances')
      .select('*, updates:grievance_updates(*), assignments:grievance_assignments(*), attachments:grievance_attachments(*)')
      .eq('assigned_worker_id', effectiveWorkerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message || 'Failed to load assigned grievances.');
    return (data || []) as Grievance[];
  }

  return DEMO_GRIEVANCES.filter(
    (g) => g.status === 'ASSIGNED' || g.status === 'IN_PROGRESS' || g.assigned_worker_id !== undefined
  );
};

/**
 * Get detailed Grievance by ID
 */
export const getGrievanceById = async (id: string | number): Promise<Grievance> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('grievances')
      .select('*, updates:grievance_updates(*), assignments:grievance_assignments(*), attachments:grievance_attachments(*)')
      .eq('id', id)
      .single();

    if (error || !data) throw new Error(error?.message || 'Grievance not found.');
    return data as Grievance;
  }

  const found = DEMO_GRIEVANCES.find((g) => String(g.id) === String(id));
  if (!found) throw new Error('Grievance not found.');
  return found;
};

/**
 * Admin Action: Verify Grievance (SUBMITTED -> VERIFIED)
 */
export const verifyGrievance = async (
  id: string | number,
  notes: string = 'Verified on-site necessity by Panchayat Administration.'
): Promise<Grievance> => {
  const actorName = typeof localStorage !== 'undefined' ? localStorage.getItem('fullName') || 'Panchayat Admin' : 'Panchayat Admin';

  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('grievances')
      .update({ status: 'VERIFIED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message || 'Failed to verify grievance.');

    await supabase.from('grievance_updates').insert({
      grievance_id: id,
      actor_id: user?.id,
      actor_name: actorName,
      actor_role: 'Panchayat Secretary',
      old_status: 'SUBMITTED',
      new_status: 'VERIFIED',
      message: notes,
    });

    return await getGrievanceById(id);
  }

  const g = DEMO_GRIEVANCES.find((item) => String(item.id) === String(id));
  if (g) {
    g.status = 'VERIFIED';
    g.updated_at = new Date().toISOString();
    g.updates = g.updates || [];
    g.updates.push({
      id: `u_${Date.now()}`,
      grievance_id: id,
      actor_name: actorName,
      actor_role: 'Panchayat Secretary',
      old_status: 'SUBMITTED',
      new_status: 'VERIFIED',
      message: notes,
      created_at: new Date().toISOString(),
    });
    return g;
  }
  throw new Error('Grievance not found.');
};

/**
 * Admin Action: Assign Grievance to Technician (VERIFIED -> ASSIGNED)
 */
export const assignGrievanceToWorker = async (
  id: string | number,
  workerId: string,
  workerName: string,
  notes: string = 'Dispatched for field remediation.'
): Promise<Grievance> => {
  const actorName = typeof localStorage !== 'undefined' ? localStorage.getItem('fullName') || 'Panchayat Admin' : 'Panchayat Admin';

  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();

    const { error: gErr } = await supabase
      .from('grievances')
      .update({
        status: 'ASSIGNED',
        assigned_worker_id: workerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (gErr) throw new Error(gErr.message || 'Failed to assign grievance.');

    await supabase.from('grievance_assignments').insert({
      grievance_id: id,
      worker_id: workerId,
      assigned_by: user?.id,
      status: 'ASSIGNED',
      notes,
    });

    await supabase.from('grievance_updates').insert({
      grievance_id: id,
      actor_id: user?.id,
      actor_name: actorName,
      actor_role: 'Panchayat Secretary',
      old_status: 'VERIFIED',
      new_status: 'ASSIGNED',
      message: `Assigned to ${workerName}: ${notes}`,
    });

    return await getGrievanceById(id);
  }

  const g = DEMO_GRIEVANCES.find((item) => String(item.id) === String(id));
  if (g) {
    g.status = 'ASSIGNED';
    g.assigned_worker_id = workerId;
    g.assigned_worker_name = workerName;
    g.updated_at = new Date().toISOString();
    g.updates = g.updates || [];
    g.updates.push({
      id: `u_${Date.now()}`,
      grievance_id: id,
      actor_name: actorName,
      actor_role: 'Panchayat Secretary',
      old_status: 'VERIFIED',
      new_status: 'ASSIGNED',
      message: `Assigned to ${workerName}: ${notes}`,
      created_at: new Date().toISOString(),
    });
    return g;
  }
  throw new Error('Grievance not found.');
};

/**
 * Worker / Admin Action: Update Grievance Status (e.g. IN_PROGRESS, RESOLVED, CLOSED)
 */
export const updateGrievanceStatus = async (
  id: string | number,
  newStatus: GrievanceStatus,
  message: string,
  actorRole: string = 'Field Worker'
): Promise<Grievance> => {
  const actorName = typeof localStorage !== 'undefined' ? localStorage.getItem('fullName') || 'Authority' : 'Authority';

  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();

    const updatePayload: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === 'RESOLVED') {
      updatePayload.resolved_at = new Date().toISOString();
      updatePayload.resolution_notes = message;
    } else if (newStatus === 'CLOSED') {
      updatePayload.closed_at = new Date().toISOString();
    }

    const { error: gErr } = await supabase
      .from('grievances')
      .update(updatePayload)
      .eq('id', id);

    if (gErr) throw new Error(gErr.message || 'Failed to update grievance status.');

    await supabase.from('grievance_updates').insert({
      grievance_id: id,
      actor_id: user?.id,
      actor_name: actorName,
      actor_role: actorRole,
      new_status: newStatus,
      message,
    });

    return await getGrievanceById(id);
  }

  const g = DEMO_GRIEVANCES.find((item) => String(item.id) === String(id));
  if (g) {
    const old = g.status;
    g.status = newStatus;
    g.updated_at = new Date().toISOString();
    if (newStatus === 'RESOLVED') {
      g.resolved_at = new Date().toISOString();
      g.resolution_notes = message;
    } else if (newStatus === 'CLOSED') {
      g.closed_at = new Date().toISOString();
    }

    g.updates = g.updates || [];
    g.updates.push({
      id: `u_${Date.now()}`,
      grievance_id: id,
      actor_name: actorName,
      actor_role: actorRole,
      old_status: old,
      new_status: newStatus,
      message,
      created_at: new Date().toISOString(),
    });
    return g;
  }
  throw new Error('Grievance not found.');
};

/**
 * Escalate Grievance to District Collector (IN_PROGRESS/ASSIGNED -> ESCALATED)
 */
export const escalateGrievance = async (
  id: string | number,
  reason: string
): Promise<Grievance> => {
  const actorName = typeof localStorage !== 'undefined' ? localStorage.getItem('fullName') || 'Panchayat Admin' : 'Panchayat Admin';

  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('grievances')
      .update({ status: 'ESCALATED', updated_at: new Date().toISOString() })
      .eq('id', id);

    await supabase.from('grievance_escalations').insert({
      grievance_id: id,
      escalated_by: user?.id,
      reason,
      from_authority: 'Gram Panchayat',
      to_authority: 'District Collector',
      status: 'PENDING',
    });

    await supabase.from('grievance_updates').insert({
      grievance_id: id,
      actor_id: user?.id,
      actor_name: actorName,
      actor_role: 'Panchayat Administration',
      new_status: 'ESCALATED',
      message: `Escalated to District Collector: ${reason}`,
    });

    return await getGrievanceById(id);
  }

  const g = DEMO_GRIEVANCES.find((item) => String(item.id) === String(id));
  if (g) {
    g.status = 'ESCALATED';
    g.updated_at = new Date().toISOString();
    g.updates = g.updates || [];
    g.updates.push({
      id: `u_${Date.now()}`,
      grievance_id: id,
      actor_name: actorName,
      actor_role: 'Panchayat Administration',
      new_status: 'ESCALATED',
      message: `Escalated to District Collector: ${reason}`,
      created_at: new Date().toISOString(),
    });
    return g;
  }
  throw new Error('Grievance not found.');
};

/**
 * Add a comment/update message to a Grievance without changing status
 */
export const addGrievanceComment = async (
  id: string | number,
  message: string,
  actorRole: string = 'Citizen'
): Promise<GrievanceUpdate> => {
  const actorName = typeof localStorage !== 'undefined' ? localStorage.getItem('fullName') || 'Citizen' : 'Citizen';

  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('grievance_updates')
      .insert({
        grievance_id: id,
        actor_id: user?.id,
        actor_name: actorName,
        actor_role: actorRole,
        message,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message || 'Failed to add comment.');
    return data as GrievanceUpdate;
  }

  const newUpdate: GrievanceUpdate = {
    id: `u_${Date.now()}`,
    grievance_id: id,
    actor_name: actorName,
    actor_role: actorRole,
    message,
    created_at: new Date().toISOString(),
  };

  const g = DEMO_GRIEVANCES.find((item) => String(item.id) === String(id));
  if (g) {
    g.updates = g.updates || [];
    g.updates.push(newUpdate);
  }
  return newUpdate;
};

/**
 * Helper to fetch available field technicians
 */
export const getAvailableWorkers = async (): Promise<Array<{ id: string; name: string; specialty: string }>> => {
  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, username')
      .eq('role', 'worker');

    if (data && data.length > 0) {
      return data.map((w) => ({
        id: w.id,
        name: w.name || w.username,
        specialty: 'Infrastructure Technician',
      }));
    }
  }

  return [
    { id: 'demo_worker_001', name: 'Suresh Kumar', specialty: 'Water & Plumbing' },
    { id: 'demo_worker_002', name: 'Ramesh Patel', specialty: 'Electrical Grid' },
    { id: 'demo_worker_003', name: 'Vinod Sharma', specialty: 'Civil Works & Roads' },
    { id: 'demo_worker_004', name: 'Anita Devi', specialty: 'Sanitation & Health' },
  ];
};

export default {
  submitGrievance,
  getMyGrievances,
  getGrievancesByJurisdiction,
  getAssignedGrievances,
  getGrievanceById,
  verifyGrievance,
  assignGrievanceToWorker,
  updateGrievanceStatus,
  escalateGrievance,
  addGrievanceComment,
  getAvailableWorkers,
};
