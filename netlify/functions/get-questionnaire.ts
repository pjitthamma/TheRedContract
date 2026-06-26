const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store",
  },
  body: JSON.stringify(body),
});

type QuestionRow = {
  id: string;
  question_order: number;
  question_kind: "scored" | "special";
  question_en: string;
  question_th: string;
};

type ChoiceRow = {
  id: string;
  question_id: string;
  choice_order: number;
  label: string;
  choice_en: string;
  choice_th: string;
  score_b: number;
  score_d: number;
  score_s: number;
  score_m: number;
  special_action: "redirect" | "too_young" | "continue" | null;
  special_url: string | null;
  feedback_en: string | null;
  feedback_th: string | null;
};

export const handler = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Supabase environment variables are missing" });
  }

  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
  };

  const [questionsResponse, choicesResponse] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/questionnaire_questions?select=id,question_order,question_kind,question_en,question_th&active=eq.true&order=question_order.asc`,
      { headers },
    ),
    fetch(
      `${supabaseUrl}/rest/v1/questionnaire_choices?select=id,question_id,choice_order,label,choice_en,choice_th,score_b,score_d,score_s,score_m,special_action,special_url,feedback_en,feedback_th&active=eq.true&order=choice_order.asc`,
      { headers },
    ),
  ]);

  if (!questionsResponse.ok || !choicesResponse.ok) {
    return json(500, { error: "Could not fetch questionnaire" });
  }

  const questions = (await questionsResponse.json()) as QuestionRow[];
  const choices = (await choicesResponse.json()) as ChoiceRow[];

  return json(200, {
    questions: questions.map((question) => ({
      id: question.id,
      order: question.question_order,
      kind: question.question_kind,
      text: {
        en: question.question_en,
        th: question.question_th,
      },
      choices: choices
        .filter((choice) => choice.question_id === question.id)
        .map((choice) => ({
          id: choice.id,
          label: choice.label,
          text: {
            en: choice.choice_en,
            th: choice.choice_th,
          },
          scores: {
            b: choice.score_b,
            d: choice.score_d,
            s: choice.score_s,
            m: choice.score_m,
          },
          specialAction: choice.special_action ?? undefined,
          specialUrl: choice.special_url ?? undefined,
          feedback:
            choice.feedback_en || choice.feedback_th
              ? {
                  en: choice.feedback_en ?? "",
                  th: choice.feedback_th ?? choice.feedback_en ?? "",
                }
              : undefined,
        })),
    })),
  });
};
