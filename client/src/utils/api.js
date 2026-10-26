/**
 * API Utility for ShopEasy Frontend
 * Handles dynamic backend base URL (VITE_API_URL), cookie credentials,
 * and Authorization header fallback for cross-origin deployments on Render.
 */

// Production deployed backend URL on Render
const DEPLOYED_BACKEND_URL = 'https://fsd-t5ll.onrender.com';

// Use environment variable if set, otherwise default to deployed backend in production
const RAW_API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? DEPLOYED_BACKEND_URL : '')
).trim();

const TOKEN_KEY = 'shopeasy_token';

// Normalize base URL without trailing slash or duplicate /api
export const getBaseUrl = () => {
  if (!RAW_API_URL) return '';
  return RAW_API_URL.replace(/\/+$/, '');
};

export const getApiUrl = (endpoint) => {
  const base = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (!base) {
    return cleanEndpoint;
  }

  // Prevent duplicate /api if VITE_API_URL was set with a trailing /api
  if (base.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    return `${base}${cleanEndpoint.slice(4)}`;
  }

  return `${base}${cleanEndpoint}`;
};

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch (e) {
    return null;
  }
};

export const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.error('Error saving token:', e);
  }
};

export const removeStoredToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('Error removing token:', e);
  }
};

/**
 * Standard fetch wrapper for ShopEasy API requests
 */
export async function apiRequest(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  const token = getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach Authorization header fallback if token is present
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Always send cookies (HttpOnly)
  };

  try {
    const response = await fetch(url, config);

    // Try to parse JSON response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { success: response.ok, message: text || `HTTP ${response.status}` };
    }

    if (!response.ok) {
      const errorMessage = data?.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // If it's already an error with a status, rethrow
    if (error.status) throw error;

    // Network / DNS / CORS connection error
    console.error(`API request error on ${url}:`, error.message);
    const networkError = new Error(
      error.message || 'Unable to connect to the backend server. Please verify network connectivity.'
    );
    networkError.isNetworkError = true;
    throw networkError;
  }
}
