export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Makes an authenticated API call. Auth is carried by the HttpOnly cookie
 * set on login — never read or written by JavaScript. credentials:'include'
 * tells the browser to attach it automatically on every cross-origin request.
 */
export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // sends the HttpOnly wbpl_jwt cookie
    cache: 'no-store', // prevents browser caching of GET requests to ensure fresh data
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

  if (response.status === 204) return null;

  return response.json();
}

/**
 * Upload a file (multipart) to the API.
 */
export async function apiUpload(path, formData) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    // Do NOT set Content-Type – browser sets it automatically with boundary
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Upload failed: ${response.status}`);
  }

  return response.json();
}
