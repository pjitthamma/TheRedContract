const ALLOWED_EVENTS = new Set([
  "club_visited",
  "door_clicked",
  "poster_clicked",
  "lineup_bluerose_clicked",
  "lineup_decree_clicked",
  "lineup_stray_clicked",
  "lineup_meteor_clicked",
  "poster_lineup_clicked",
  "brochure_clicked",
  "club_rules_clicked",
  "member_card_clicked",
  "breached_attempt_clicked",
  "door_knocked",
  "card_clicked",
  "b_picture_clicked",
  "b_host_profile_clicked",
  "b_photos_clicked",
  "b_ring_bell_clicked",
]);

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify(body),
});

export const handler = async (event: { httpMethod: string; body: string | null }) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Supabase environment variables are missing" });
  }

  let payload: { eventName?: string; sessionId?: string };
  try {
    payload = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  if (!payload.eventName || !ALLOWED_EVENTS.has(payload.eventName)) {
    return json(400, { error: "Invalid event name" });
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/site_events`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      event_name: payload.eventName,
      session_id: payload.sessionId ?? null,
    }),
  });

  if (!response.ok) {
    return json(500, { error: "Could not track event" });
  }

  return json(200, { ok: true });
};
