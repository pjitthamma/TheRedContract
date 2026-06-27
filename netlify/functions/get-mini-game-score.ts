type RoomKey = "b" | "d" | "m" | "s";

type ScoreRow = {
  click_count: number;
};

type PlaySessionRow = {
  id: number;
};

const roomKeys = new Set<RoomKey>(["b", "d", "m", "s"]);

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store",
  },
  body: JSON.stringify(body),
});

export const handler = async (event: { queryStringParameters?: { guestName?: string; playToken?: string; roomKey?: string } | null }) => {
  const roomKey = event.queryStringParameters?.roomKey as RoomKey | undefined;
  const guestName = event.queryStringParameters?.guestName?.trim().slice(0, 20);
  const playToken = event.queryStringParameters?.playToken?.trim();

  if (!roomKey || !roomKeys.has(roomKey)) {
    return json(400, { error: "Valid roomKey is required" });
  }
  if (!guestName) {
    return json(400, { error: "Guest name is required" });
  }
  if (!playToken) {
    return json(401, { error: "Play session is required" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Supabase environment variables are missing" });
  }

  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
  };
  const now = encodeURIComponent(new Date().toISOString());
  const sessionResponse = await fetch(
    `${supabaseUrl}/rest/v1/invitation_results?select=id&winning_room=eq.${roomKey}&guest_name=eq.${encodeURIComponent(guestName)}&active_play_token=eq.${encodeURIComponent(playToken)}&active_play_expires_at=gt.${now}&limit=1`,
    { headers },
  );

  if (!sessionResponse.ok) {
    return json(500, { error: "Could not validate play session" });
  }

  const sessionRows = (await sessionResponse.json()) as PlaySessionRow[];
  if (!sessionRows.length) {
    return json(401, { error: "Session expired. Please enter your code again." });
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/mini_game_scores?select=click_count&room_key=eq.${roomKey}&guest_name=eq.${encodeURIComponent(guestName)}&limit=1`,
    { headers },
  );

  if (!response.ok) {
    return json(500, { error: "Could not fetch score" });
  }

  const rows = (await response.json()) as ScoreRow[];
  return json(200, {
    guestScore: rows[0]?.click_count ?? 0,
  });
};
