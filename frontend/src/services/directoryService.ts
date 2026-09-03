/**
 * GRAM-X Government Services Directory & Public Notices Service
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { GrievanceCategory } from './grievanceService';

export interface GovernmentServiceItem {
  id: string;
  category: GrievanceCategory;
  name: string;
  department: string;
  nodal_officer: string;
  helpline: string;
  sla_days: number;
  is_active: boolean;
}

export interface PublicNoticeItem {
  id: string;
  title: string;
  description: string;
  category: GrievanceCategory;
  location_scope: string;
  is_emergency: boolean;
  status: 'ACTIVE' | 'RESOLVED' | 'ARCHIVED';
  created_at: string;
}

const DEFAULT_SERVICES: GovernmentServiceItem[] = [
  {
    id: 'srv_1',
    category: 'water',
    name: 'Rural Drinking Water & Handpump Maintenance',
    department: 'Public Health Engineering Department (PHED)',
    nodal_officer: 'Assistant Engineer (PHED)',
    helpline: '1800-180-5678',
    sla_days: 2,
    is_active: true,
  },
  {
    id: 'srv_2',
    category: 'electricity',
    name: 'Rural Power Distribution & Transformer Repair',
    department: 'State Electricity Distribution Co. (DISCOM)',
    nodal_officer: 'Junior Engineer (DISCOM)',
    helpline: '1912',
    sla_days: 1,
    is_active: true,
  },
  {
    id: 'srv_3',
    category: 'roads',
    name: 'Panchayat Village Roads & Drainage Remediation',
    department: 'Rural Development & Panchayat Raj (RDPR)',
    nodal_officer: 'Panchayat Development Officer (PDO)',
    helpline: '1800-425-9999',
    sla_days: 4,
    is_active: true,
  },
  {
    id: 'srv_4',
    category: 'sanitation',
    name: 'Solid Waste Management & Swachh Bharat Infrastructure',
    department: 'Swachh Bharat Mission (Grameen)',
    nodal_officer: 'Block Sanitation Officer',
    helpline: '1800-11-2020',
    sla_days: 2,
    is_active: true,
  },
  {
    id: 'srv_5',
    category: 'infrastructure',
    name: 'Public School & Anganwadi Infrastructure Support',
    department: 'Department of School Education & Literacy',
    nodal_officer: 'Block Education Officer',
    helpline: '1800-111-222',
    sla_days: 7,
    is_active: true,
  },
];

const DEFAULT_NOTICES: PublicNoticeItem[] = [
  {
    id: 'notice_1',
    title: 'Piparli Village Main Pipeline Scheduled Maintenance',
    description: 'Scheduled water pump overhaul in Ward 3 and 4 between 10:00 AM and 04:00 PM tomorrow.',
    category: 'water',
    location_scope: 'Piparli Gram Panchayat',
    is_emergency: false,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
  },
  {
    id: 'notice_2',
    title: 'Monsoon Silt Cleaning Drive in Drainage Culverts',
    description: 'Sanitation teams are carrying out preventative silt clearance across all arterial village paths.',
    category: 'sanitation',
    location_scope: 'Barkheda Gram Panchayat',
    is_emergency: false,
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400 * 1000).toISOString(),
  },
];

export const getGovernmentServices = async (): Promise<GovernmentServiceItem[]> => {
  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from('government_services')
      .select('*')
      .eq('is_active', true);
    if (data && data.length > 0) return data as GovernmentServiceItem[];
  }
  return DEFAULT_SERVICES;
};

export const getActivePublicNotices = async (): Promise<PublicNoticeItem[]> => {
  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from('public_notices')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });
    if (data && data.length > 0) return data as PublicNoticeItem[];
  }
  return DEFAULT_NOTICES;
};

export default {
  getGovernmentServices,
  getActivePublicNotices,
};
