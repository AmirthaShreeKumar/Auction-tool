/**
 * api.js – centralized API base URL configuration.
 *
 * In development: reads from VITE_API_URL environment variable or falls back to localhost.
 * In production: set VITE_API_URL in your deployment platform (Vercel, Netlify, etc.)
 *
 * To configure locally: create a .env.local file in auction-frontend/:
 *   VITE_API_URL=http://localhost:8080
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Makes an authenticated API call using the stored JWT token.
 *
 * @param {string} path - API path (e.g. '/api/pune/players')
 * @param {RequestInit} options - fetch options
 * @returns {Promise<any>} parsed JSON response
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('wbp_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMsg = errorBody.message || errorMsg;
    } catch {
      // ignore JSON parse error for non-JSON responses
    }
    throw new Error(errorMsg);
  }

  // Handle 204 No Content
  if (response.status === 204) return null;

  return response.json();
}

/**
 * Upload a file (multipart) to the API.
 */
export async function apiUpload(path, formData) {
  const token = localStorage.getItem('wbp_token');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Do NOT set Content-Type – browser sets it automatically with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Upload failed: ${response.status}`);
  }

  return response.json();
}
