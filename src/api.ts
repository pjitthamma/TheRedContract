/// <reference types="vite/client" />

// Leave unset until the Cloudflare database has been imported and verified.
const baseUrl = (import.meta.env.VITE_API_BASE_URL || "/.netlify/functions").replace(/\/$/, "");

const publicData = new Map<string, string>();
const preloadPaths = ["get-questionnaire", ...["b", "d", "s", "m"].map(room => "get-mini-game-leaderboard?roomKey=" + room)];

export async function preloadPublicData() {
  await Promise.all(preloadPaths.map(async path => {
    const response = await apiFetch(path);
    if (!response.ok) throw new Error("Public data unavailable");
  }));
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const cacheable = (!options.method || options.method === "GET") && preloadPaths.includes(path);
  if (cacheable && publicData.has(path)) return new Response(publicData.get(path), { headers: { "content-type": "application/json" } });
  const timeout = AbortSignal.timeout(15_000);
  const response = await fetch(`${baseUrl}/${path.replace(/^\//, "")}`, {
    ...options,
    signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
  });
  if (cacheable && response.ok) publicData.set(path, await response.clone().text());
  return response;
}
