/// <reference types="vite/client" />

// Leave unset until the Cloudflare database has been imported and verified.
const baseUrl = (import.meta.env.VITE_API_BASE_URL || "/.netlify/functions").replace(/\/$/, "");

export function apiFetch(path: string, options: RequestInit = {}) {
  const timeout = AbortSignal.timeout(15_000);
  return fetch(`${baseUrl}/${path.replace(/^\//, "")}`, {
    ...options,
    signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
  });
}
