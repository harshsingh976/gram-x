/**
 * GRAM-X Secure Data Export Service
 * Generates scoped CSV and JSON exports for authorized officials without exposing private credentials.
 */

import type { Grievance } from './grievanceService';

export const exportGrievancesAsCSV = (grievances: Grievance[], filename = 'gramx_grievances_export.csv'): void => {
  if (typeof window === 'undefined') return;

  const headers = [
    'Reference No',
    'Title',
    'Category',
    'Priority',
    'Status',
    'Location',
    'Created At',
    'Assigned Worker',
  ];

  const rows = grievances.map((g) => [
    `"${g.reference_no}"`,
    `"${(g.title || '').replace(/"/g, '""')}"`,
    `"${g.category}"`,
    `"${g.priority}"`,
    `"${g.status}"`,
    `"${(g.location_address || '').replace(/"/g, '""')}"`,
    `"${g.created_at}"`,
    `"${g.assigned_worker_id || 'Unassigned'}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportGrievancesAsJSON = (grievances: Grievance[], filename = 'gramx_grievances_export.json'): void => {
  if (typeof window === 'undefined') return;

  // Anonymize/format data safely
  const safeData = grievances.map((g) => ({
    reference_no: g.reference_no,
    title: g.title,
    description: g.description,
    category: g.category,
    priority: g.priority,
    status: g.status,
    location_address: g.location_address,
    created_at: g.created_at,
  }));

  const jsonStr = JSON.stringify(safeData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default {
  exportGrievancesAsCSV,
  exportGrievancesAsJSON,
};
