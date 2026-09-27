import { HttpError, optionalText, text } from "./http";

export const rooms = ["b", "d", "s", "m"] as const;
export type Room = typeof rooms[number];
type Scores = Record<Room, number>;
type Question = {
  id: string; question_order: number; question_kind: string; question_en: string; question_th: string;
};
type Choice = {
  id: string; question_id: string; label: string; choice_en: string; choice_th: string;
  score_b: number; score_d: number; score_s: number; score_m: number;
  special_action: string | null; special_url: string | null; feedback_en: string | null; feedback_th: string | null;
};
export const nameKey = (name: string) => name.trim().toLowerCase();
export function room(value: unknown): Room {
  if (!rooms.includes(value as Room)) throw new HttpError(400, "Valid roomKey is required");
  return value as Room;
}
export function playSession() {
  return {
    playToken: Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join(""),
    playTokenExpiresAt: new Date(Date.now() + 300_000).toISOString(),
    playSessionId: crypto.randomUUID(),
  };
}

async function rows(db: D1Database) {
  const [questions, choices] = await db.batch([
    db.prepare("SELECT id,question_order,question_kind,question_en,question_th FROM questionnaire_questions WHERE active=1 ORDER BY question_order"),
    db.prepare("SELECT * FROM questionnaire_choices WHERE active=1 ORDER BY choice_order"),
  ]);
  return { questions: questions.results as Question[], choices: choices.results as Choice[] };
}

export async function questionnaire(db: D1Database) {
  const { questions, choices } = await rows(db);
  const byQuestion = new Map<string, Choice[]>();
  for (const choice of choices) {
    const group = byQuestion.get(choice.question_id) ?? [];
    group.push(choice);
    byQuestion.set(choice.question_id, group);
  }
  return { questions: questions.map(q => ({
    id: q.id, order: q.question_order, kind: q.question_kind,
    text: { en: q.question_en, th: q.question_th },
    choices: (byQuestion.get(q.id) ?? []).map(c => ({
      id: c.id, label: c.label, text: { en: c.choice_en, th: c.choice_th },
      scores: { b: c.score_b, d: c.score_d, s: c.score_s, m: c.score_m },
      specialAction: c.special_action ?? undefined, specialUrl: c.special_url ?? undefined,
      feedback: c.feedback_en || c.feedback_th ? { en: c.feedback_en ?? "", th: c.feedback_th ?? c.feedback_en ?? "" } : undefined,
    })),
  })) };
}

export async function result(db: D1Database, payload: Record<string, unknown>, save: boolean) {
  const guestName = text(payload.guestName, "guestName", 20);
  const answeredDate = text(payload.answeredDate, "answeredDate", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(answeredDate) || !Number.isFinite(Date.parse(answeredDate)) ||
      new Date(answeredDate).toISOString().slice(0, 10) !== answeredDate) {
    throw new HttpError(400, "Answered date must be a valid YYYY-MM-DD date");
  }
  const { questions, choices } = await rows(db);
  if (!questions.length) throw new HttpError(503, "Questionnaire is not configured");
  if (!Array.isArray(payload.answers) || payload.answers.length !== questions.length) {
    throw new HttpError(400, "All questionnaire answers are required");
  }
  const choiceMap = new Map(choices.map(c => [c.id, c]));
  const required = new Set(questions.map(q => q.id));
  const scores: Scores = { b: 0, d: 0, s: 0, m: 0 };
  const answers: { questionId: string; choiceId: string }[] = [];
  for (const item of payload.answers) {
    if (!item || typeof item !== "object") throw new HttpError(400, "Invalid answer");
    const questionId = text(item.questionId, "questionId");
    const choiceId = text(item.choiceId, "choiceId");
    const choice = choiceMap.get(choiceId);
    if (!required.delete(questionId) || !choice || choice.question_id !== questionId ||
        choice.special_action === "too_young" || choice.special_action === "redirect") {
      throw new HttpError(400, "Invalid questionnaire answer");
    }
    for (const key of rooms) scores[key] += choice[`score_${key}`];
    answers.push({ questionId, choiceId });
  }
  const winningRoom = rooms.reduce((best, key) => scores[key] > scores[best] ? key : best, rooms[0]);
  const codes = await db.prepare("SELECT code FROM invitation_codes WHERE room_key=? AND active=1 ORDER BY id").bind(winningRoom).all<{code: string}>();
  const requestedCode = payload.invitationCode == null ? null : text(payload.invitationCode, "invitationCode");
  const invitationCode = requestedCode
    ? codes.results.find(c => c.code.toLowerCase() === requestedCode.toLowerCase())?.code
    : codes.results[crypto.getRandomValues(new Uint32Array(1))[0] % codes.results.length]?.code;
  if (!invitationCode) throw new HttpError(requestedCode ? 400 : 503, "No valid invitation code is available for this room");

  // Compute percentiles in SQL; never transfer every guest result to a function.
  const aggregates = rooms.map(key =>
    `coalesce(round(100.0 * sum(CASE WHEN json_extract(scores,'$.${key}') <= ? THEN 1 ELSE 0 END) / nullif(count(json_extract(scores,'$.${key}')),0)),50) AS ${key}`);
  const comparisonPercentages = await db.prepare(`SELECT ${aggregates.join(",")} FROM invitation_results WHERE winning_room=?`)
    .bind(...rooms.map(key => scores[key]), winningRoom).first<Scores>();
  const preview = { guestName, answeredDate, answers, scores, comparisonPercentages, winningRoom, invitationCode };
  if (!save) return preview;
  const session = playSession();
  const inserted = await db.prepare(`INSERT INTO invitation_results
    (guest_name,guest_name_key,answered_date,answers,scores,winning_room,invitation_code,session_id,active_play_token,active_play_session_id,active_play_expires_at)
    SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS
      (SELECT 1 FROM invitation_results WHERE guest_name_key=?) RETURNING id`)
    .bind(guestName, nameKey(guestName), answeredDate, JSON.stringify(answers), JSON.stringify(scores), winningRoom,
      invitationCode, optionalText(payload.sessionId), session.playToken, session.playSessionId, session.playTokenExpiresAt, nameKey(guestName)).first();
  if (!inserted) throw new HttpError(409, "This guest name is already registered.");
  return { ...preview, playToken: session.playToken, playTokenExpiresAt: session.playTokenExpiresAt };
}
