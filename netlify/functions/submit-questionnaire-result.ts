import { randomBytes } from "node:crypto";

type HostKey = "b" | "d" | "s" | "m";

type SubmittedAnswer = {
  questionId: string;
  choiceId: string;
};

type SubmitPayload = {
  guestName?: string;
  answeredDate?: string;
  answers?: SubmittedAnswer[];
  invitationCode?: string;
  sessionId?: string;
};

type ChoiceRow = {
  id: string;
  question_id: string;
  score_b: number;
  score_d: number;
  score_s: number;
  score_m: number;
};

type CodeRow = {
  code: string;
};

type ResultRow = {
  guest_name?: string;
  scores: Partial<Record<HostKey, number>> | null;
};

const hostOrder: HostKey[] = ["b", "d", "s", "m"];
const PLAY_SESSION_TTL_MS = 5 * 60 * 1000;

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store",
  },
  body: JSON.stringify(body),
});

const getWinner = (scores: Record<HostKey, number>) =>
  hostOrder.reduce((best, host) => (scores[host] > scores[best] ? host : best), hostOrder[0]);

const getComparisonPercentages = (scores: Record<HostKey, number>, peerResults: ResultRow[]) => {
  const percentages: Record<HostKey, number> = { b: 100, d: 100, s: 100, m: 100 };
  if (!peerResults.length) {
    return percentages;
  }

  for (const host of hostOrder) {
    const peersWithScore = peerResults
      .map((result) => Number(result.scores?.[host]))
      .filter((score) => Number.isFinite(score));

    if (!peersWithScore.length) {
      continue;
    }

    const lowerOrEqualCount = peersWithScore.filter((score) => score <= scores[host]).length;
    percentages[host] = Math.round((lowerOrEqualCount / peersWithScore.length) * 100);
  }

  return percentages;
};

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

  const guestName = payload.guestName?.trim();
  const answeredDate = payload.answeredDate?.trim();
  const answers = payload.answers ?? [];
  const requestedInvitationCode = payload.invitationCode?.trim();

  if (!guestName) {
    return json(400, { error: "Guest name is required" });
  }
  if (!answeredDate || !/^\d{4}-\d{2}-\d{2}$/.test(answeredDate)) {
    return json(400, { error: "Answered date must use YYYY-MM-DD" });
  }
  if (!Array.isArray(answers) || answers.length < 11) {
    return json(400, { error: "All questionnaire answers are required" });
  }

  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
  };

  const existingGuestResponse = await fetch(`${supabaseUrl}/rest/v1/invitation_results?select=guest_name`, { headers });
  if (!existingGuestResponse.ok) {
    return json(500, { error: "Could not check guest name" });
  }

  const existingGuestRows = (await existingGuestResponse.json()) as ResultRow[];
  const normalizedGuestName = guestName.toLocaleLowerCase();
  const guestNameExists = existingGuestRows.some(
    (row) => row.guest_name?.trim().toLocaleLowerCase() === normalizedGuestName,
  );

  if (guestNameExists) {
    return json(409, { error: "This guest name is already registered." });
  }

  const selectedChoiceIds = [...new Set(answers.map((answer) => answer.choiceId).filter(Boolean))];
  const choicesResponse = await fetch(
    `${supabaseUrl}/rest/v1/questionnaire_choices?select=id,question_id,score_b,score_d,score_s,score_m&id=in.(${selectedChoiceIds.join(",")})`,
    { headers },
  );

  if (!choicesResponse.ok) {
    return json(500, { error: "Could not fetch selected choices" });
  }

  const choices = (await choicesResponse.json()) as ChoiceRow[];
  const choicesById = new Map(choices.map((choice) => [choice.id, choice]));
  const scores: Record<HostKey, number> = { b: 0, d: 0, s: 0, m: 0 };

  for (const answer of answers) {
    const choice = choicesById.get(answer.choiceId);
    if (!choice || choice.question_id !== answer.questionId) {
      return json(400, { error: "Invalid questionnaire answer" });
    }

    scores.b += choice.score_b;
    scores.d += choice.score_d;
    scores.s += choice.score_s;
    scores.m += choice.score_m;
  }

  const winningRoom = getWinner(scores);
  const codeResponse = await fetch(
    `${supabaseUrl}/rest/v1/invitation_codes?select=code&room_key=eq.${winningRoom}&active=eq.true&order=id.asc`,
    { headers },
  );

  if (!codeResponse.ok) {
    return json(500, { error: "Could not fetch invitation code" });
  }

  const codes = (await codeResponse.json()) as CodeRow[];
  const invitationCode = requestedInvitationCode
    ? codes.find((codeRow) => codeRow.code.toLocaleLowerCase() === requestedInvitationCode.toLocaleLowerCase())?.code
    : codes[Math.floor(Math.random() * codes.length)]?.code;
  if (!invitationCode) {
    return json(500, { error: "No invitation code is available for this room" });
  }

  const peerResultsResponse = await fetch(
    `${supabaseUrl}/rest/v1/invitation_results?select=scores&winning_room=eq.${winningRoom}`,
    { headers },
  );

  const comparisonPercentages = peerResultsResponse.ok
    ? getComparisonPercentages(scores, ((await peerResultsResponse.json()) as ResultRow[]) ?? [])
    : { b: 100, d: 100, s: 100, m: 100 };
  const playToken = randomBytes(32).toString("base64url");
  const playTokenExpiresAt = new Date(Date.now() + PLAY_SESSION_TTL_MS).toISOString();
  const playSessionId = randomBytes(16).toString("base64url");

  const insertResponse = await fetch(`${supabaseUrl}/rest/v1/invitation_results`, {
    method: "POST",
    headers: {
      ...headers,
      prefer: "return=representation",
    },
    body: JSON.stringify({
      guest_name: guestName,
      answered_date: answeredDate,
      answers,
      scores,
      winning_room: winningRoom,
      invitation_code: invitationCode,
      session_id: payload.sessionId ?? null,
      active_play_token: playToken,
      active_play_session_id: playSessionId,
      active_play_expires_at: playTokenExpiresAt,
    }),
  });

  if (!insertResponse.ok) {
    return json(500, { error: "Could not save questionnaire result" });
  }

  return json(200, {
    guestName,
    answeredDate,
    answers,
    scores,
    comparisonPercentages,
    winningRoom,
    invitationCode,
    playToken,
    playTokenExpiresAt,
  });
};
