type HostKey = "b" | "d" | "s" | "m";

type SubmittedAnswer = {
  questionId: string;
  choiceId: string;
};

type SubmitPayload = {
  guestName?: string;
  answeredDate?: string;
  answers?: SubmittedAnswer[];
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

const hostOrder: HostKey[] = ["b", "d", "s", "m"];

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
    `${supabaseUrl}/rest/v1/invitation_codes?select=code&room_key=eq.${winningRoom}&active=eq.true&order=id.asc&limit=1`,
    { headers },
  );

  if (!codeResponse.ok) {
    return json(500, { error: "Could not fetch invitation code" });
  }

  const codes = (await codeResponse.json()) as CodeRow[];
  const invitationCode = codes[0]?.code;
  if (!invitationCode) {
    return json(500, { error: "No invitation code is available for this room" });
  }

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
    winningRoom,
    invitationCode,
  });
};
