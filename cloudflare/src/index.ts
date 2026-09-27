import { body, HttpError, json, optionalText, text } from "./http";
import { nameKey, playSession, questionnaire, result, room } from "./questionnaire";
import { eventNames } from "./events";

const getRoutes = new Set(["get-questionnaire", "get-counts", "get-mini-game-score", "get-mini-game-leaderboard"]);
const postRoutes = new Set(["track-event", "check-guest-name", "validate-invitation-code", "preview-questionnaire-result", "submit-questionnaire-result", "submit-mini-game-score"]);

async function route(request: Request, db: D1Database) {
  const url = new URL(request.url);
  const match = /^\/(?:api|\.netlify\/functions)\/([^/]+)$/.exec(url.pathname);
  const endpoint = match?.[1] ?? "";
  if (!getRoutes.has(endpoint) && !postRoutes.has(endpoint)) throw new HttpError(404, "Not found");
  if (request.method !== (getRoutes.has(endpoint) ? "GET" : "POST")) throw new HttpError(405, "Method not allowed");
  const p = request.method === "POST" ? await body(request) : Object.fromEntries(url.searchParams);
  switch (endpoint) {
    case "get-questionnaire": return json(await questionnaire(db), 200, "public, max-age=60");
    case "get-counts": {
      const rows = await db.prepare("SELECT event_name,count FROM event_counts").all<{event_name: string; count: number}>();
      const counts = Object.fromEntries(eventNames.map(name => [name, 0]));
      for (const row of rows.results) if (eventNames.includes(row.event_name)) counts[row.event_name] = row.count;
      return json({ counts }, 200, "public, max-age=15");
    }
    case "track-event": {
      const eventName = text(p.eventName, "eventName");
      if (!eventNames.includes(eventName)) throw new HttpError(400, "Invalid event name");
      await db.prepare("INSERT INTO site_events(event_name,session_id) VALUES(?,?)").bind(eventName, optionalText(p.sessionId)).run();
      return json({ ok: true });
    }
    case "check-guest-name": {
      const guestName = text(p.guestName, "guestName", 20);
      const existing = await db.prepare("SELECT id FROM invitation_results WHERE guest_name_key=?").bind(nameKey(guestName)).first();
      if (existing) throw new HttpError(409, "This guest name is already registered.");
      return json({ available: true });
    }
    case "preview-questionnaire-result": return json(await result(db, p, false));
    case "submit-questionnaire-result": return json(await result(db, p, true));
    case "validate-invitation-code": {
      const roomKey = room(p.roomKey);
      const guestName = text(p.guestName, "guestName", 20);
      const invitationCode = text(p.invitationCode, "invitationCode");
      const session = playSession();
      const guest = await db.prepare(`UPDATE invitation_results
        SET active_play_token=?,active_play_session_id=?,active_play_expires_at=?
        WHERE id=(SELECT id FROM invitation_results WHERE guest_name_key=? AND winning_room=? AND lower(invitation_code)=? ORDER BY id LIMIT 1)
        RETURNING guest_name`).bind(session.playToken, session.playSessionId, session.playTokenExpiresAt,
          nameKey(guestName), roomKey, invitationCode.toLowerCase()).first<{guest_name: string}>();
      if (!guest) throw new HttpError(403, "Invitation code does not match this guest.");
      return json({ ok: true, guestName: guest.guest_name, roomKey, playToken: session.playToken, playTokenExpiresAt: session.playTokenExpiresAt });
    }
    case "get-mini-game-leaderboard": {
      const rows = await db.prepare("SELECT guest_name AS name,click_count AS score FROM mini_game_scores WHERE room_key=? ORDER BY click_count DESC,updated_at ASC,guest_name ASC")
        .bind(room(p.roomKey)).all();
      return json({ leaderboard: rows.results }, 200, "public, max-age=15");
    }
    case "get-mini-game-score": {
      const roomKey = room(p.roomKey);
      const guestName = text(p.guestName, "guestName", 20);
      if (!p.playToken) throw new HttpError(401, "Play session is required");
      const token = text(p.playToken, "playToken");
      const score = await db.prepare(`SELECT coalesce(s.click_count,0) AS guestScore FROM invitation_results r
        LEFT JOIN mini_game_scores s ON s.room_key=r.winning_room AND s.guest_name=r.guest_name
        WHERE r.guest_name_key=? AND r.winning_room=? AND r.active_play_token=? AND r.active_play_expires_at>?`)
        .bind(nameKey(guestName), roomKey, token, new Date().toISOString()).first();
      if (!score) throw new HttpError(401, "Session expired. Please enter your code again.");
      return json(score);
    }
    case "submit-mini-game-score":
      return json({ error: "This event has ended. Scores are no longer accepted.", eventEnded: true }, 410);
    default: throw new HttpError(404, "Not found");
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const origin = request.headers.get("origin");
    const allowed = env.ALLOWED_ORIGINS.split(",").map(value => value.trim());
    if (origin && !allowed.includes(origin)) return json({ error: "Origin not allowed" }, 403);
    let response: Response;
    try {
      response = request.method === "OPTIONS" ? new Response(null, { status: 204 })
        : String(env.READ_ONLY) === "true" && request.method !== "GET"
          ? json({ error: "Database migration in progress. Please try again shortly." }, 503)
          : await route(request, env.DB);
    } catch (error) {
      if (error instanceof HttpError) response = json({ error: error.message }, error.status);
      else {
        // Avoid logging payloads, tokens, names or SQL bind parameters.
        console.error(JSON.stringify({ event: "api_error", path: new URL(request.url).pathname }));
        response = json({ error: "Service temporarily unavailable" }, 503);
      }
    }
    response.headers.set("Vary", "Origin");
    response.headers.set("X-Content-Type-Options", "nosniff");
    if (origin) response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  },
} satisfies ExportedHandler<Env>;
