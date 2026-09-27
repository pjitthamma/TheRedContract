type RoomKey = "b" | "d" | "s" | "m";

type SubmitPayload = {
  roomKey?: RoomKey;
  guestName?: string;
  clickCount?: number;
  playToken?: string;
  sessionId?: string;
};

type SavedScoreRow = {
  room_key: RoomKey;
  guest_name: string;
  click_count: number;
};

const roomKeys = new Set<RoomKey>(["b", "d", "s", "m"]);

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store",
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

  let payload: SubmitPayload;
  try {
    payload = JSON.parse(event.body ?? "{}") as SubmitPayload;
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const roomKey = payload.roomKey;
  const guestName = payload.guestName?.trim().slice(0, 20);
  const playToken = payload.playToken?.trim();
  const rawClickCount = Number(payload.clickCount ?? 0);
  const clickCount = Number.isFinite(rawClickCount) ? Math.max(0, Math.floor(rawClickCount)) : 0;

  if (!roomKey || !roomKeys.has(roomKey)) {
    return json(400, { error: "Valid roomKey is required" });
  }
  if (!guestName) {
    return json(400, { error: "Guest name is required" });
  }
  if (!playToken) {
    return json(401, { error: "Play session is required" });
  }

  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
  };

  const saveResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/upsert_mini_game_score_max`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      p_room_key: roomKey,
      p_guest_name: guestName,
      p_click_count: clickCount,
      p_play_token: playToken,
      p_session_id: payload.sessionId ?? null,
    }),
  });

  if (!saveResponse.ok) {
    return json(500, { error: "Could not save score" });
  }

  const savedRows = (await saveResponse.json()) as SavedScoreRow[];
  const savedScore = savedRows[0];
  if (!savedScore) {
    return json(401, { error: "Session expired. Please enter your code again." });
  }

  return json(200, {
    roomKey: savedScore?.room_key ?? roomKey,
    guestName: savedScore?.guest_name ?? guestName,
    clickCount: savedScore?.click_count ?? clickCount,
  });
};
