const EVENT_NAMES = [
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
  "d_picture_clicked",
  "d_host_profile_clicked",
  "d_photos_clicked",
  "d_ring_bell_clicked",
  "b_wing_clicked",
  "d_wing_clicked",
  "s_wing_clicked",
  "m_wing_clicked",
] as const;

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store",
  },
  body: JSON.stringify(body),
});

const parseCount = (contentRange: string | null) => {
  if (!contentRange) {
    return 0;
  }

  const count = contentRange.split("/").at(-1);
  return count ? Number(count) : 0;
};

export const handler = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Supabase environment variables are missing" });
  }

  const entries = await Promise.all(
    EVENT_NAMES.map(async (eventName) => {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/site_events?select=id&event_name=eq.${eventName}`,
        {
          method: "HEAD",
          headers: {
            apikey: serviceRoleKey,
            authorization: `Bearer ${serviceRoleKey}`,
            prefer: "count=exact",
            range: "0-0",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Could not fetch count for ${eventName}`);
      }

      return [eventName, parseCount(response.headers.get("content-range"))] as const;
    }),
  );

  return json(200, { counts: Object.fromEntries(entries) });
};
