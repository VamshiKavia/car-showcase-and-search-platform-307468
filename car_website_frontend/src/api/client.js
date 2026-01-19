const DEFAULT_DEV_BACKEND = "http://localhost:3001";

/**
 * Returns the backend base URL from env configuration.
 * Prefers REACT_APP_API_BASE, then falls back to REACT_APP_BACKEND_URL.
 * In dev, falls back to http://localhost:3001.
 *
 * Note: CRA only exposes env vars prefixed with REACT_APP_.
 */
function getApiBaseUrl() {
  const raw = (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || DEFAULT_DEV_BACKEND).trim();

  // Remove trailing slashes to avoid double slashes when joining paths.
  return raw.replace(/\/+$/, "");
}

/**
 * Safely join base URL and a path.
 * Ensures exactly one slash between them.
 */
function joinUrl(base, path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Convert a key-value object to query string.
 * - Skips null/undefined/empty-string values
 */
function toQueryString(params) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    const s = String(v);
    if (!s.trim()) return;
    sp.set(k, s);
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Parse an error response body (best-effort) to a readable message.
 */
async function readErrorMessage(resp) {
  try {
    const data = await resp.json();
    if (data && typeof data === "object") {
      if (typeof data.message === "string" && data.message.trim()) return data.message;
      if (typeof data.status === "string" && data.status.trim()) return data.status;
    }
  } catch {
    // ignore
  }
  try {
    const text = await resp.text();
    if (text && text.trim()) return text;
  } catch {
    // ignore
  }
  return `Request failed with status ${resp.status}`;
}

// PUBLIC_INTERFACE
export async function apiGetJson(path, { query = {}, signal } = {}) {
  /**
   * Perform a GET request returning JSON, throwing a rich Error on failures.
   *
   * @param {string} path - e.g. "/api/cars"
   * @param {object} options
   * @param {object} options.query - key/value query params (empty strings are omitted)
   * @param {AbortSignal} options.signal - optional abort signal
   */
  const base = getApiBaseUrl();
  const url = joinUrl(base, path) + toQueryString(query);

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!resp.ok) {
    const message = await readErrorMessage(resp);
    const err = new Error(message);
    err.status = resp.status;
    err.url = url;
    throw err;
  }

  return resp.json();
}

export const __internal = { getApiBaseUrl, joinUrl, toQueryString };
