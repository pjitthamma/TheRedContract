type Event = {
  httpMethod: string;
  body: string | null;
  isBase64Encoded?: boolean;
  queryStringParameters?: Record<string, string | undefined> | null;
};
type Result = { statusCode: number; headers: Record<string,string>; body: string };

// Keep cached clients on the old endpoint URLs working after the database cutover.
// The source database remains read-only, so older immutable deploys cannot split writes.
export function withBackend(endpoint: string, legacy: (event: Event) => Promise<Result>) {
  return async (event: Event): Promise<Result> => {
    // A source rollback must be explicit; never silently split writes between databases.
    if (process.env.RED_CONTRACT_BACKEND === "supabase") return legacy(event);
    const base = new URL(process.env.CLOUDFLARE_API_BASE_URL || "https://the-red-contract-api.patboke-jit.workers.dev/api");
    if (base.pathname === "/") base.pathname = "/api";
    const url = new URL(`${base.toString().replace(/\/$/, "")}/${endpoint}`);
    for (const [key,value] of Object.entries(event.queryStringParameters ?? {})) {
      if (value !== undefined) url.searchParams.set(key,value);
    }
    try {
      const response = await fetch(url, {
        method: event.httpMethod,
        headers: { "content-type": "application/json" },
        body: ["GET","HEAD"].includes(event.httpMethod) ? undefined
          : event.isBase64Encoded ? Buffer.from(event.body ?? "", "base64") : event.body,
        signal: AbortSignal.timeout(15_000),
        redirect: "error",
      });
      return {
        statusCode: response.status,
        headers: { "content-type": "application/json", "cache-control": response.headers.get("cache-control") ?? "no-store" },
        body: await response.text(),
      };
    } catch {
      return { statusCode: 503, headers: { "content-type": "application/json", "cache-control": "no-store" },
        body: JSON.stringify({ error: "Service temporarily unavailable. Please try again." }) };
    }
  };
}
