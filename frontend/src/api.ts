const API_BASE = (function getApiBase(): string {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (window.location.hostname.includes('onrender.com')) {
      return 'https://gramx-backend.onrender.com/api';
    }
    return `${window.location.protocol}//api.${window.location.host.replace(/^(citizen|worker|admin|collector)\./, '')}/api`;
  }
  return 'http://127.0.0.1:8000/api';
})();

// Helper to construct headers with JWT auth if present
export function getHeaders(token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const activeToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  return headers;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err: any) {
    throw new Error('Unable to connect to server. Please check your internet connection.');
  }

  if (res.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh') && !url.includes('/auth/signup')) {
    const refreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('token', data.access_token);
              if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
            }
            isRefreshing = false;
            onRefreshed(data.access_token);
            headers.set('Authorization', `Bearer ${data.access_token}`);
            return fetch(url, { ...options, headers });
          } else {
            isRefreshing = false;
            logout();
          }
        } catch {
          isRefreshing = false;
          logout();
        }
      } else {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            headers.set('Authorization', `Bearer ${newToken}`);
            resolve(fetch(url, { ...options, headers }));
          });
        });
      }
    }
  }

  return res;
}

export async function login(username: string, password: string) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Incorrect credentials' }));
      throw new Error(err.detail || 'Incorrect user ID or password.');
    }
    return res.json();
  } catch (err: any) {
    if (err.message && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the authentication server. Please check your connection.');
    }
    throw err;
  }
}

export async function signup(req: {
  username: string;
  password: string;
  name: string;
  email?: string;
  role?: string;
  village_id?: number;
}) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create account' }));
    throw new Error(err.detail || 'Failed to create account');
  }
  return res.json();
}
export const registerUser = signup;

export async function refreshSession(refreshToken: string) {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  if (!res.ok) throw new Error('Failed to refresh session');
  return res.json();
}

export async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getHeaders()
    });
  } finally {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      localStorage.removeItem('fullName');
    }
  }
}

export async function getMe() {
  const res = await authenticatedFetch(`${API_BASE}/auth/me`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Session expired' }));
    throw new Error(err.detail || 'Session expired. Please log in again.');
  }
  return res.json();
}

export async function forgotPassword(username_or_email: string) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username_or_email })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to request password reset' }));
    throw new Error(err.detail || 'Failed to request password reset');
  }
  return res.json();
}

export async function verifyResetOtp(username_or_email: string, otp_code: string) {
  const res = await fetch(`${API_BASE}/auth/verify-reset-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username_or_email, otp_code })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Invalid or expired OTP code' }));
    throw new Error(err.detail || 'Invalid or expired OTP code');
  }
  return res.json(); // returns { reset_ticket, message }
}

export async function resetPasswordWithToken(req: {
  username_or_email: string;
  reset_ticket: string;
  new_password: string;
}) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update password' }));
    throw new Error(err.detail || 'Failed to update password');
  }
  return res.json();
}
export const resetPassword = resetPasswordWithToken;

export async function fetchVoiceLanguages() {
  const res = await fetch(`${API_BASE}/ai/voice/languages`);
  if (!res.ok) return { hi: { name: 'Hindi' }, en: { name: 'English' } };
  return res.json();
}

export async function retryVoiceTranscription(evidenceId: number) {
  const res = await fetch(`${API_BASE}/ai/voice/retry/${evidenceId}`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to retry transcription');
  return res.json();
}



export async function fetchVillages() {
  const res = await fetch(`${API_BASE}/villages`, { headers: getHeaders() });
  return res.json();
}

export async function fetchVillageMetrics(id: number) {
  const res = await fetch(`${API_BASE}/villages/${id}/metrics`, { headers: getHeaders() });
  return res.json();
}

export async function fetchAssets(villageId?: number) {
  const url = villageId ? `${API_BASE}/assets?village_id=${villageId}` : `${API_BASE}/assets`;
  const res = await fetch(url, { headers: getHeaders() });
  return res.json();
}

export async function fetchAssetDetail(id: number) {
  const res = await fetch(`${API_BASE}/assets/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Asset not found');
  return res.json();
}

export async function fetchIncidents(villageId?: number) {
  const url = villageId ? `${API_BASE}/incidents?village_id=${villageId}` : `${API_BASE}/incidents`;
  const res = await fetch(url, { headers: getHeaders() });
  return res.json();
}

export async function fetchIncidentsPaginated(params: {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  severity?: string;
  search?: string;
  village_id?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.category) query.set('category', params.category);
  if (params.status) query.set('status', params.status);
  if (params.severity) query.set('severity', params.severity);
  if (params.search) query.set('search', params.search);
  if (params.village_id) query.set('village_id', String(params.village_id));
  if (params.sort_by) query.set('sort_by', params.sort_by);
  if (params.sort_order) query.set('sort_order', params.sort_order);

  const res = await fetch(`${API_BASE}/incidents?${query.toString()}`, { headers: getHeaders() });
  const data = await res.json();
  const totalCount = parseInt(res.headers.get('X-Total-Count') || '0', 10);
  const totalPages = parseInt(res.headers.get('X-Total-Pages') || '1', 10);
  const currentPage = parseInt(res.headers.get('X-Page') || '1', 10);

  return {
    items: data,
    totalCount: isNaN(totalCount) ? data.length : totalCount,
    totalPages: isNaN(totalPages) ? 1 : totalPages,
    currentPage: isNaN(currentPage) ? 1 : currentPage,
  };
}

export async function fetchGisFeatures(params: {
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
  layers?: string;
  limit?: number;
}) {
  const query = new URLSearchParams({
    min_lat: String(params.min_lat),
    min_lng: String(params.min_lng),
    max_lat: String(params.max_lat),
    max_lng: String(params.max_lng),
    layers: params.layers || 'all',
    limit: String(params.limit || 250)
  });

  const res = await fetch(`${API_BASE}/gis/features?${query.toString()}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch GIS features');
  return res.json();
}

export async function fetchIncidentDetail(id: number) {
  const res = await fetch(`${API_BASE}/incidents/${id}`, { headers: getHeaders() });
  return res.json();
}

export async function submitIncidentReport(data: {
  title: string;
  description?: string;
  category: string;
  village_id: number;
  latitude: number;
  longitude: number;
  asset_id?: number;
  reporter_name?: string;
  evidence_photo?: string;
  voice_base64?: string;
  photo_base64?: string;
}) {
  const res = await fetch(`${API_BASE}/incidents/report`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit report');
  return res.json();
}
export const reportIncident = submitIncidentReport;

export async function fetchProjects(villageId?: number) {
  const url = villageId ? `${API_BASE}/projects?village_id=${villageId}` : `${API_BASE}/projects`;
  const res = await fetch(url, { headers: getHeaders() });
  return res.json();
}

export async function verifyProjectOutcome(projectId: number, observedMetrics: any) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/verify`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ observed_metrics: observedMetrics })
  });
  return res.json();
}

export async function runWhatIfSimulation(incidentId: number, delayMonths: number) {
  const res = await fetch(`${API_BASE}/simulations/what-if`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ incident_id: incidentId, delay_months: delayMonths })
  });
  if (!res.ok) throw new Error('Failed to run What-If simulation');
  return res.json();
}

export async function fetchReuseRecommendations(villageId: number) {
  const res = await fetch(`${API_BASE}/simulations/reuse-before-build?village_id=${villageId}`, { headers: getHeaders() });
  return res.json();
}

export async function fetchAvailableWorkers(incidentId: number) {
  const res = await fetch(`${API_BASE}/workers/available?incident_id=${incidentId}`, { headers: getHeaders() });
  return res.json();
}

export async function fetchAllWorkers() {
  const res = await fetch(`${API_BASE}/workers`, { headers: getHeaders() });
  return res.json();
}

export async function dispatchWorker(incidentId: number, technicianId: number, description?: string) {
  const res = await fetch(`${API_BASE}/tasks/create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ incident_id: incidentId, technician_id: technicianId, description })
  });
  return res.json();
}

export async function acceptTask(taskId: number) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/accept`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return res.json();
}

export async function requestPriceIncrease(
  taskId: number, 
  additionalCost: number, 
  workDone: string, 
  whatWasWrong: string, 
  productEffect: string
) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/request-price-increase`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      additional_cost: additionalCost,
      work_done: workDone,
      what_was_wrong: whatWasWrong,
      product_effect: productEffect
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to request scope increase' }));
    throw new Error(err.detail || 'Failed to request scope increase');
  }
  return res.json();
}

export async function approveScopeIncrease(taskId: number) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/approve-scope`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to approve scope revision' }));
    throw new Error(err.detail || 'Failed to approve scope revision');
  }
  return res.json();
}

export async function rejectScopeIncrease(taskId: number, reason?: string) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/reject-scope`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to reject scope revision' }));
    throw new Error(err.detail || 'Failed to reject scope revision');
  }
  return res.json();
}

export async function updateTaskStatus(taskId: number, status: string) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/status`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  return res.json();
}

export async function fetchTasks() {
  const res = await fetch(`${API_BASE}/tasks`, { headers: getHeaders() });
  return res.json();
}

export async function fetchMyTasks() {
  const res = await fetch(`${API_BASE}/tasks/mine`, { headers: getHeaders() });
  return res.json();
}

export async function fetchTask(taskId: number) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, { headers: getHeaders() });
  return res.json();
}

export async function submitTaskReview(taskId: number, rating: number, comments: string) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/review`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ rating, comments })
  });
  if (!res.ok) throw new Error('Failed to submit task review');
  return res.json();
}

export async function verifyIncident(incidentId: number, status: string, remarks: string, verifier: string) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/verify`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      verifier,
      verification_status: status,
      remarks
    })
  });
  if (!res.ok) throw new Error('Failed to submit incident verification');
  return res.json();
}

export async function submitReuseDecision(assetId: number, assetName: string, decision: string) {
  const res = await fetch(`${API_BASE}/simulations/reuse-decide`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      asset_id: assetId,
      asset_name: assetName,
      decision
    })
  });
  if (!res.ok) throw new Error('Failed to submit reuse decision');
  return res.json();
}

export async function fetchReuseDecisions() {
  const res = await fetch(`${API_BASE}/simulations/reuse-decisions`, { headers: getHeaders() });
  return res.json();
}

export async function fetchVillageLedger(villageId: number) {
  const res = await fetch(`${API_BASE}/villages/${villageId}/ledger`, { headers: getHeaders() });
  return res.json();
}

export async function issueCollectorDirective(incidentId: number, directiveText: string, priorityOverride?: string) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/collector-directive`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      directive_text: directiveText,
      priority_override: priorityOverride
    })
  });
  if (!res.ok) throw new Error('Failed to issue collector directive');
  return res.json();
}

export async function fetchGovernanceHealth() {
  const res = await fetch(`${API_BASE}/governance/health`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch governance health data');
  return res.json();
}

export async function runGovernanceReconcile() {
  const res = await fetch(`${API_BASE}/governance/reconcile`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to execute governance reconciliation');
  return res.json();
}

export async function uploadTaskEvidence(
  taskId: number, 
  data: { 
    photo_base64?: string; 
    voice_base64?: string; 
    file_name?: string; 
    file_type?: string; 
    work_summary?: string; 
  }
) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/upload-evidence`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload task evidence' }));
    throw new Error(err.detail || 'Failed to upload task evidence');
  }
  return res.json();
}

export async function reviewEvidence(evidenceId: number, action: 'accepted' | 'rejected', remarks?: string) {
  const res = await fetch(`${API_BASE}/evidence/${evidenceId}/review`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action, remarks })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to review evidence' }));
    throw new Error(err.detail || 'Failed to review evidence');
  }
  return res.json();
}

export async function fetchNotifications() {
  const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function markNotificationRead(id: number) {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'POST',
    headers: getHeaders()
  });
  return res.json();
}

export async function markAllNotificationsRead() {
  const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
    method: 'POST',
    headers: getHeaders()
  });
  return res.json();
}

// System Observability & Operations
export async function fetchSystemOperations() {
  const res = await fetch(`${API_BASE}/system/operations`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch system operations metrics');
  return res.json();
}

// Audit Logs Query & Filtering
export async function fetchAuditLogs(params?: {
  page?: number;
  page_size?: number;
  action?: string;
  actor?: string;
  role?: string;
  severity?: string;
  incident_id?: number;
  task_id?: number;
  date_from?: string;
  date_to?: string;
}) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
  }
  const res = await fetch(`${API_BASE}/audit/logs?${query.toString()}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}
export const fetchAuditChain = fetchAuditLogs;

export function getAuditExportUrl(params?: Record<string, any>) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
  }
  return `${API_BASE}/audit/export?${query.toString()}`;
}

export async function fetchRecentGovernanceActivity(limit: number = 10) {
  const res = await fetch(`${API_BASE}/governance/activity?limit=${limit}`, { headers: getHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchCollectorExecutiveSummary() {
  const res = await fetch(`${API_BASE}/collector/summary`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch collector executive summary');
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// RECURRING PROBLEM & ROOT-CAUSE INTELLIGENCE
// ─────────────────────────────────────────────────────────────
export async function fetchRecurringProblems(params?: {
  village_id?: number;
  category?: string;
  risk_level?: string;
  min_recurrence?: number;
}) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
  }
  const res = await fetch(`${API_BASE}/governance/recurring-problems?${query.toString()}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch recurring problem clusters');
  return res.json();
}

export async function fetchRecurringProblemDetail(clusterId: string) {
  const res = await fetch(`${API_BASE}/governance/recurring-problems/${clusterId}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch details for problem cluster ${clusterId}`);
  return res.json();
}

export async function fetchRecurringProblemIncidents(clusterId: string) {
  const res = await fetch(`${API_BASE}/governance/recurring-problems/${clusterId}/incidents`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch incidents for problem cluster ${clusterId}`);
  return res.json();
}

export async function fetchDistrictProblemRisk(districtName?: string) {
  const query = districtName ? `?district_name=${encodeURIComponent(districtName)}` : '';
  const res = await fetch(`${API_BASE}/collector/problem-risk${query}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch district infrastructure problem risks');
  return res.json();
}

export async function analyzeRecurringProblems() {
  const res = await fetch(`${API_BASE}/governance/recurring-problems/analyze`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to execute recurring problems analysis');
  return res.json();
}

export async function issueClusterDirective(clusterId: string, directiveText: string, priorityOverride: string = 'critical') {
  const res = await fetch(`${API_BASE}/governance/recurring-problems/${clusterId}/directive`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      directive_text: directiveText,
      priority_override: priorityOverride
    })
  });
  if (!res.ok) throw new Error('Failed to issue structural intervention directive');
  return res.json();
}

// Interactive Demo Scenario endpoints
export async function getDemoState() {
  const res = await fetch(`${API_BASE}/demo/status`, { headers: getHeaders() });
  return res.json();
}

export async function advanceDemo(step: number) {
  const res = await fetch(`${API_BASE}/demo/step`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ step })
  });
  if (!res.ok) throw new Error('Failed to update demo step');
  return res.json();
}

export async function verifyAuditChain() {
  const res = await fetch(`${API_BASE}/audit/verify-chain`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to verify audit trail cryptographic hash chain');
  return res.json();
}

export async function fetchReadiness() {
  const res = await fetch('/readiness');
  if (!res.ok) throw new Error('System readiness probe reported unready');
  return res.json();
}

export async function fetchAppConfig() {
  const res = await fetch(`${API_BASE}/config`, { headers: getHeaders() });
  if (!res.ok) return { APP_MODE: 'development', BASE_DOMAIN: 'localhost' };
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// KNOWLEDGE BASE & SEMANTIC SEARCH (Vector Layer)
// ─────────────────────────────────────────────────────────────
export async function searchKnowledgeBase(query: string, category?: string, limit: number = 5) {
  const res = await fetch(`${API_BASE}/knowledge/search`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ query, category, limit })
  });
  if (!res.ok) throw new Error('Failed to search knowledge base');
  return res.json();
}

export async function fetchKnowledgeArticles(category?: string) {
  const url = category ? `${API_BASE}/knowledge/articles?category=${category}` : `${API_BASE}/knowledge/articles`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchSimilarIncidents(incidentId: number) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/similar`, { headers: getHeaders() });
  if (!res.ok) return { source_incident_id: incidentId, similar_incidents: [], total_similar: 0 };
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// FLEXIBLE INSPECTIONS & SURVEYS (MongoDB Layer)
// ─────────────────────────────────────────────────────────────
export async function createInspectionRecord(data: {
  incident_id?: number;
  task_id?: number;
  asset_id?: number;
  inspector_name: string;
  service_type: string;
  observations?: Record<string, any>;
  measurements?: Record<string, any>;
  dynamic_fields?: Record<string, any>;
  recommendations?: string;
  risk_level?: string;
}) {
  const res = await fetch(`${API_BASE}/inspections`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create inspection record');
  return res.json();
}

export async function fetchInspectionRecords(params?: {
  incident_id?: number;
  task_id?: number;
  asset_id?: number;
  service_type?: string;
}) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) query.append(k, String(v));
    });
  }
  const res = await fetch(`${API_BASE}/inspections?${query.toString()}`, { headers: getHeaders() });
  if (!res.ok) return [];
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// OBJECT & FILE STORAGE (Binary Evidence Store)
// ─────────────────────────────────────────────────────────────
export async function uploadEvidenceFile(file: File, resourceType: string = 'incident_evidence', resourceId?: number) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('resource_type', resourceType);
  if (resourceId) formData.append('resource_id', String(resourceId));

  const activeToken = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const res = await fetch(`${API_BASE}/storage/upload`, {
    method: 'POST',
    headers,
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload file to object storage');
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// POLYGLOT SYSTEM HEALTH & SUBSYSTEM STATUS
// ─────────────────────────────────────────────────────────────
export async function fetchDetailedHealth() {
  const res = await fetch(`${API_BASE}/health/detailed`);
  if (!res.ok) throw new Error('Failed to fetch detailed subsystem health');
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// MULTILINGUAL AI & INTELLIGENCE API METHODS
// ─────────────────────────────────────────────────────────────
export async function transcribeVoiceReport(voicePayload: string) {
  const res = await fetch(`${API_BASE}/ai/voice/transcribe`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ voice_base64: voicePayload })
  });
  if (!res.ok) throw new Error('Failed to transcribe voice payload');
  return res.json();
}

export async function analyzeVisionImage(photoBase64: string) {
  const res = await fetch(`${API_BASE}/ai/vision/analyze`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ photo_base64: photoBase64 })
  });
  if (!res.ok) throw new Error('Failed to analyze vision image');
  return res.json();
}

export async function fetchAIModelStatus() {
  const res = await fetch(`${API_BASE}/ai/models/status`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch AI model registry status');
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// DIGITAL TWIN 3D SPATIAL & SIMULATION APIS
// ─────────────────────────────────────────────────────────────
export async function fetchSpatialScene() {
  const res = await fetch(`${API_BASE}/digital-twin/spatial-scene`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch spatial scene');
  return res.json();
}

export async function simulateDigitalTwin3D(simulationType: string = 'hydraulic_surge', stressFactor: number = 1.3) {
  const res = await fetch(`${API_BASE}/digital-twin/simulate-3d?simulation_type=${simulationType}&stress_factor=${stressFactor}`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to run 3D digital twin simulation');
  return res.json();
}

