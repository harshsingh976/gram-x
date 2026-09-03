/**
 * GRAM-X Centralized API Client
 * Provides robust HTTP request handling with error differentiation and token management.
 */

export const getApiBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    // In browser with Vite dev proxy active, use relative /api
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return '/api';
    }
    // Remote cloud production deployment
    if (window.location.hostname.includes('onrender.com')) {
      return 'https://gramx-backend.onrender.com/api';
    }
    return `${window.location.protocol}//api.${window.location.host.replace(/^(citizen|worker|admin|collector)\./, '')}/api`;
  }
  
  return 'http://127.0.0.1:8000/api';
};

export interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export const apiRequest = async <T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = cleanEndpoint.startsWith('http') ? cleanEndpoint : `${baseUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError: any) {
    // Distinguish genuine backend unreachable / CORS errors from ordinary app issues
    console.error(`[GRAM-X API] Network connection failed for ${url}:`, networkError);
    throw new Error(
      `Authentication backend is currently unreachable at ${baseUrl}. Please ensure the backend server is running.`
    );
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    // Extract structured error details
    let errorMessage = `Request failed (${response.status})`;
    
    if (data && typeof data === 'object') {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      } else if (data.message) {
        errorMessage = data.message;
      }
    }

    if (response.status === 401) {
      if (cleanEndpoint.includes('/auth/login')) {
        errorMessage = 'Incorrect User ID or password. Please verify your credentials.';
      }
    }

    throw new Error(errorMessage);
  }

  return data as T;
};
