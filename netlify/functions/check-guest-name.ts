type CheckPayload = {
  guestName?: string;
};

type GuestRow = {
  guest_name: string;
};

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

  let payload: CheckPayload;
  try {
    payload = JSON.parse(event.body ?? "{}") as CheckPayload;
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const guestName = payload.guestName?.trim().slice(0, 20);
  if (!guestName) {
    return json(400, { error: "Guest name is required" });
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/invitation_results?select=guest_name`, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    return json(500, { error: "Could not check guest name" });
  }

  const rows = (await response.json()) as GuestRow[];
  const normalizedGuestName = guestName.toLocaleLowerCase();
  const exists = rows.some((row) => row.guest_name.trim().toLocaleLowerCase() === normalizedGuestName);

  if (exists) {
    return json(409, { error: "This guest name is already registered." });
  }

  return json(200, { available: true });
};
