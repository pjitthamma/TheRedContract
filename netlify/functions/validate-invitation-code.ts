type RoomKey = "b" | "d" | "s" | "m";

type ValidatePayload = {
  roomKey?: RoomKey;
  guestName?: string;
  invitationCode?: string;
};

type InvitationResultRow = {
  guest_name: string;
  invitation_code: string;
  winning_room: RoomKey;
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

  let payload: ValidatePayload;
  try {
    payload = JSON.parse(event.body ?? "{}") as ValidatePayload;
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const roomKey = payload.roomKey;
  const guestName = payload.guestName?.trim().slice(0, 20);
  const invitationCode = payload.invitationCode?.trim();

  if (!roomKey || !roomKeys.has(roomKey)) {
    return json(400, { error: "Valid roomKey is required" });
  }
  if (!guestName) {
    return json(400, { error: "Guest name is required" });
  }
  if (!invitationCode) {
    return json(400, { error: "Invitation code is required" });
  }

  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
  };

  const response = await fetch(
    `${supabaseUrl}/rest/v1/invitation_results?select=guest_name,invitation_code,winning_room&winning_room=eq.${roomKey}`,
    { headers },
  );

  if (!response.ok) {
    return json(500, { error: "Could not validate invitation code" });
  }

  const rows = (await response.json()) as InvitationResultRow[];
  const normalizedGuestName = guestName.toLocaleLowerCase();
  const guestRows = rows.filter((row) => row.guest_name.trim().toLocaleLowerCase() === normalizedGuestName);

  if (!guestRows.length) {
    return json(404, { error: "No guest found for this name." });
  }

  const matchingRow = guestRows.find(
    (row) => row.invitation_code.trim().toLocaleLowerCase() === invitationCode.toLocaleLowerCase(),
  );

  if (!matchingRow) {
    return json(403, { error: "Invitation code does not match this guest." });
  }

  return json(200, {
    ok: true,
    guestName: matchingRow.guest_name,
    roomKey: matchingRow.winning_room,
  });
};
