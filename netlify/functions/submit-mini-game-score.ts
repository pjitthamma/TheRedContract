type RoomKey = "b" | "d" | "s" | "m";

type SubmitPayload = {
  roomKey?: RoomKey;
  guestName?: string;
  clickCount?: number;
  sessionId?: string;
};

type ExistingScoreRow = {
  id: number;
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
  const clickCount = Math.max(0, Math.floor(Number(payload.clickCount ?? 0)));

  if (!roomKey || !roomKeys.has(roomKey)) {
    return json(400, { error: "Valid roomKey is required" });
  }
  if (!guestName) {
    return json(400, { error: "Guest name is required" });
  }

  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
  };

  const existingResponse = await fetch(
    `${supabaseUrl}/rest/v1/mini_game_scores?select=id,click_count&room_key=eq.${roomKey}&guest_name=eq.${encodeURIComponent(guestName)}&limit=1`,
    { headers },
  );

  if (!existingResponse.ok) {
    return json(500, { error: "Could not fetch existing score" });
  }

  const existingRows = (await existingResponse.json()) as ExistingScoreRow[];
  const existing = existingRows[0];
  const storedClickCount = Math.max(clickCount, existing?.click_count ?? 0);

  if (existing) {
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/mini_game_scores?id=eq.${existing.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        click_count: storedClickCount,
        session_id: payload.sessionId ?? null,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!updateResponse.ok) {
      return json(500, { error: "Could not update score" });
    }
  } else {
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/mini_game_scores`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        room_key: roomKey,
        guest_name: guestName,
        click_count: storedClickCount,
        session_id: payload.sessionId ?? null,
      }),
    });

    if (!insertResponse.ok) {
      return json(500, { error: "Could not save score" });
    }
  }

  return json(200, {
    roomKey,
    guestName,
    clickCount: storedClickCount,
  });
};
