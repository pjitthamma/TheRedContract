type RoomKey = "b" | "d" | "s" | "m";

type ScoreRow = {
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

export const handler = async (event: { queryStringParameters?: { guestName?: string; roomKey?: string } | null }) => {
  const roomKey = event.queryStringParameters?.roomKey as RoomKey | undefined;
  const guestName = event.queryStringParameters?.guestName?.trim().slice(0, 20);
  if (!roomKey || !roomKeys.has(roomKey)) {
    return json(400, { error: "Valid roomKey is required" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Supabase environment variables are missing" });
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/mini_game_scores?select=guest_name,click_count&room_key=eq.${roomKey}&order=click_count.desc,updated_at.asc`,
    {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );

  if (!response.ok) {
    return json(500, { error: "Could not fetch leaderboard" });
  }

  const rows = (await response.json()) as ScoreRow[];
  let guestScore: number | null = null;
  const leaderboard = rows.map((row) => ({
    name: row.guest_name,
    score: row.click_count,
  }));

  if (guestName) {
    const topTenMatch = leaderboard.find((entry) => entry.name.trim().toLocaleLowerCase() === guestName.toLocaleLowerCase());
    guestScore = topTenMatch?.score ?? null;

    if (guestScore === null) {
      const guestResponse = await fetch(
        `${supabaseUrl}/rest/v1/mini_game_scores?select=guest_name,click_count&room_key=eq.${roomKey}&guest_name=eq.${encodeURIComponent(guestName)}&limit=1`,
        {
          headers: {
            apikey: serviceRoleKey,
            authorization: `Bearer ${serviceRoleKey}`,
          },
        },
      );

      if (guestResponse.ok) {
        const guestRows = (await guestResponse.json()) as ScoreRow[];
        guestScore = guestRows[0]?.click_count ?? null;
      }
    }
  }

  return json(200, {
    guestScore,
    leaderboard,
  });
};
