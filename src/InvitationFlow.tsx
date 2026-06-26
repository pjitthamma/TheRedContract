import { Download, X } from "lucide-react";
import { toPng } from "html-to-image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type HostKey,
  type HostScoreMap,
  type InvitationLanguage,
  type QuestionnaireChoice,
  type QuestionnaireQuestion,
  fallbackInvitationCodes,
  fallbackQuestionnaire,
  hostLabels,
  hostOrder,
  hostResultImageByKey,
} from "./invitationData";

type InvitationStep = "code-prompt" | "contract" | "quiz" | "result";

type InvitationFlowProps = {
  initialStep: "code-prompt" | "contract";
  language: InvitationLanguage;
  sessionId: string;
  onExistingCode: () => void;
  onCancel: () => void;
  onNewUserStarted: () => void;
  onResultClosed: (winningRoom: HostKey) => void;
  onTooYoung: () => void;
};

type SubmittedAnswer = {
  questionId: string;
  choiceId: string;
};

type InvitationResult = {
  guestName: string;
  answeredDate: string;
  answers: SubmittedAnswer[];
  scores: HostScoreMap;
  comparisonPercentages: HostScoreMap;
  winningRoom: HostKey;
  invitationCode: string;
};

const emptyScores = (): HostScoreMap => ({ b: 0, d: 0, s: 0, m: 0 });

const shuffleQuestions = (questions: QuestionnaireQuestion[]) => {
  const shuffled = [...questions];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const getBangkokDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
};

const playPenSound = () => {
  void new Audio("/assets/pen.mp3").play();
};

const invitationCopy = {
  en: {
    invitationQuestion: "Do you has an invitation code?",
    yes: "Yes",
    no: "No",
    nameRequired: "Please enter your name before signing the contract.",
    signContract: "Sign Contract",
    question: "Question",
    answered: "answered",
    sealing: "Sealing...",
    revealResult: "Reveal Result",
    wing: "Wing",
    host: "Host",
    yourScore: "Your Score",
    comparison: "Compared With This Host's Guests",
    invitationCode: "Invitation Code",
    copyCode: "Copy Code",
    saveResult: "Save Result",
    enter: "Enter",
    tooYoung: "you are too young",
    contractAlt: "The Red Contract",
    close: "Close",
    scoreRadarLabel: "BDSM host score radar",
    comparisonRadarLabel: "Host comparison percentage radar",
  },
  th: {
    invitationQuestion: "คุณมีรหัสเชิญหรือไม่?",
    yes: "มี",
    no: "ไม่มี",
    nameRequired: "กรุณากรอกชื่อก่อนลงนามในสัญญา",
    signContract: "ลงนามในสัญญา",
    question: "คำถาม",
    answered: "ตอบแล้ว",
    sealing: "กำลังประทับตรา...",
    revealResult: "ดูผลลัพธ์",
    wing: "วิง",
    host: "โฮสต์",
    yourScore: "คะแนนของคุณ",
    comparison: "เทียบกับผู้เล่นคนอื่นที่ได้โฮสต์นี้",
    invitationCode: "รหัสเชิญ",
    copyCode: "คัดลอกรหัส",
    saveResult: "บันทึกผลลัพธ์",
    enter: "เข้า",
    tooYoung: "คุณยังเด็กเกินไป",
    contractAlt: "เดอะ เรด คอนแทรกต์",
    close: "ปิด",
    scoreRadarLabel: "กราฟคะแนนโฮสต์ BDSM",
    comparisonRadarLabel: "กราฟเปอร์เซ็นต์เปรียบเทียบกับผู้เล่นอื่น",
  },
} satisfies Record<InvitationLanguage, Record<string, string>>;

const hostWingLabels: Record<InvitationLanguage, Record<HostKey, string>> = {
  en: {
    b: "B Wing: The Restraint Room",
    d: "D Wing: The Obedience Suite",
    s: "S Wing: The Red Hunt",
    m: "M Wing: The White Room",
  },
  th: {
    b: "B Wing: ห้องพันธนาการ",
    d: "D Wing: ห้องสวีทแห่งการเชื่อฟัง",
    s: "S Wing: การล่าแดง",
    m: "M Wing: ห้องสีขาว",
  },
};

const calculateResult = (
  questions: QuestionnaireQuestion[],
  answersByQuestionId: Record<string, string>,
  guestName: string,
  answeredDate: string,
): InvitationResult => {
  const scores = emptyScores();
  const answers: SubmittedAnswer[] = [];

  for (const question of questions) {
    const choiceId = answersByQuestionId[question.id];
    const choice = question.choices.find((item) => item.id === choiceId);
    if (!choice) {
      continue;
    }

    answers.push({ questionId: question.id, choiceId });
    for (const host of hostOrder) {
      scores[host] += choice.scores[host];
    }
  }

  const winningRoom = hostOrder.reduce((best, host) => (scores[host] > scores[best] ? host : best), hostOrder[0]);
  const codePool = fallbackInvitationCodes[winningRoom];
  return {
    guestName,
    answeredDate,
    answers,
    scores,
    comparisonPercentages: { b: 100, d: 100, s: 100, m: 100 },
    winningRoom,
    invitationCode: codePool[Math.floor(Math.random() * codePool.length)] ?? codePool[0],
  };
};

function ScoreRadar({ scores, label }: { scores: HostScoreMap; label: string }) {
  const maxAbsScore = Math.max(1, ...hostOrder.map((host) => Math.abs(scores[host])));
  const center = 82;
  const maxRadius = 62;
  const points = hostOrder.map((host, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 2);
    const normalized = Math.max(0.1, (scores[host] + maxAbsScore) / (maxAbsScore * 2));
    const radius = normalized * maxRadius;
    return {
      host,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * (maxRadius + 17),
      labelY: center + Math.sin(angle) * (maxRadius + 17),
    };
  });
  const polygonPoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <svg className="invitation-radar" viewBox="0 0 164 164" role="img" aria-label={label}>
      {[0.35, 0.68, 1].map((scale) => (
        <circle key={scale} cx={center} cy={center} r={maxRadius * scale} />
      ))}
      {points.map((point) => (
        <line key={point.host} x1={center} y1={center} x2={point.labelX} y2={point.labelY} />
      ))}
      <polygon points={polygonPoints} />
      {points.map((point) => (
        <text key={point.host} x={point.labelX} y={point.labelY}>
          {point.host.toUpperCase()}
        </text>
      ))}
    </svg>
  );
}

function PercentRadar({ percentages, label }: { percentages: HostScoreMap; label: string }) {
  const center = 82;
  const maxRadius = 62;
  const points = hostOrder.map((host, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 2);
    const radius = Math.max(0.08, Math.min(1, percentages[host] / 100)) * maxRadius;
    return {
      host,
      value: percentages[host],
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * (maxRadius + 18),
      labelY: center + Math.sin(angle) * (maxRadius + 18),
    };
  });
  const polygonPoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <svg className="invitation-radar" viewBox="0 0 164 164" role="img" aria-label={label}>
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <circle key={scale} cx={center} cy={center} r={maxRadius * scale} />
      ))}
      {points.map((point) => (
        <line key={point.host} x1={center} y1={center} x2={point.labelX} y2={point.labelY} />
      ))}
      <polygon points={polygonPoints} />
      {points.map((point) => (
        <text key={point.host} x={point.labelX} y={point.labelY}>
          {point.host.toUpperCase()}-wing
        </text>
      ))}
    </svg>
  );
}

function InvitationFlow({
  initialStep,
  language,
  sessionId,
  onExistingCode,
  onCancel,
  onNewUserStarted,
  onResultClosed,
  onTooYoung,
}: InvitationFlowProps) {
  const [step, setStep] = useState<InvitationStep>(initialStep);
  const [guestName, setGuestName] = useState("");
  const [answeredDate] = useState(getBangkokDate);
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>(fallbackQuestionnaire);
  const [answersByQuestionId, setAnswersByQuestionId] = useState<Record<string, string>>({});
  const [result, setResult] = useState<InvitationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exitMessage, setExitMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resultCardRef = useRef<HTMLDivElement | null>(null);
  const copy = invitationCopy[language];

  const currentQuestionIndex = Math.min(
    questions.findIndex((question) => !answersByQuestionId[question.id]),
    questions.length - 1,
  );
  const activeQuestionIndex = currentQuestionIndex < 0 ? questions.length - 1 : currentQuestionIndex;
  const activeQuestion = questions[activeQuestionIndex];
  const answeredCount = useMemo(
    () => questions.filter((question) => Boolean(answersByQuestionId[question.id])).length,
    [answersByQuestionId, questions],
  );
  const isQuizComplete = answeredCount === questions.length;

  useEffect(() => {
    if (step !== "quiz") {
      return;
    }

    void fetch("/.netlify/functions/get-questionnaire")
      .then(async (response) => {
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { questions?: QuestionnaireQuestion[] };
        if (data.questions?.length) {
          setQuestions(shuffleQuestions(data.questions));
        }
      })
      .catch(() => {
        // Local Vite development can use the generated workbook fallback.
      });
  }, [step]);

  const startNewUserFlow = () => {
    onNewUserStarted();
    setStep("contract");
  };

  const startQuiz = () => {
    if (!guestName.trim() || !answeredDate.trim()) {
      setErrorMessage(copy.nameRequired);
      return;
    }

    setErrorMessage(null);
    setAnswersByQuestionId({});
    setQuestions(shuffleQuestions(fallbackQuestionnaire));
    setStep("quiz");
  };

  const handleChoiceSelect = (question: QuestionnaireQuestion, choice: QuestionnaireChoice) => {
    if (choice.specialAction === "redirect" && choice.specialUrl) {
      window.location.href = choice.specialUrl;
      return;
    }

    if (choice.specialAction === "too_young") {
      setExitMessage(`${choice.feedback?.[language] || copy.tooYoung}!`);
      window.setTimeout(() => {
        void new Audio("/assets/door-open.mp3").play();
        onTooYoung();
      }, 3200);
      return;
    }

    setAnswersByQuestionId((current) => ({
      ...current,
      [question.id]: choice.id,
    }));
  };

  const submitQuiz = async () => {
    if (!isQuizComplete || isSubmitting) {
      return;
    }

    const fallbackResult = calculateResult(questions, answersByQuestionId, guestName.trim(), answeredDate);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/.netlify/functions/submit-questionnaire-result", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          guestName: guestName.trim(),
          answeredDate,
          answers: fallbackResult.answers,
          sessionId,
        }),
      });

      if (response.ok) {
        const savedResult = (await response.json()) as InvitationResult;
        setResult(savedResult);
      } else {
        setResult(fallbackResult);
      }
    } catch {
      setResult(fallbackResult);
    } finally {
      setIsSubmitting(false);
      setStep("result");
    }
  };

  const copyCode = async () => {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result.invitationCode);
  };

  const saveResultImage = async () => {
    if (!resultCardRef.current) {
      return;
    }

    const dataUrl = await toPng(resultCardRef.current, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `red-contract-${result?.invitationCode ?? "result"}.png`;
    link.click();
  };

  return (
    <div className="invitation-backdrop" role="presentation">
      <section
        className={`invitation-panel invitation-panel-${step}${step === "contract" ? " invitation-panel-contract-bare" : ""}`}
        aria-live="polite"
        onClickCapture={(event) => {
          if (step === "result") {
            return;
          }
          const target = event.target as HTMLElement;
          if (target.closest("button, input")) {
            playPenSound();
          }
        }}
      >
        {exitMessage ? <div className="invitation-exit-message">{exitMessage}</div> : null}

        {step === "code-prompt" ? (
          <>
            <button className="invitation-close" type="button" aria-label={copy.close} onClick={onCancel}>
              <X size={18} aria-hidden="true" />
            </button>
            <h1>{copy.invitationQuestion}</h1>
            <div className="invitation-actions">
              <button type="button" onClick={onExistingCode}>
                {copy.yes}
              </button>
              <button type="button" onClick={startNewUserFlow}>
                {copy.no}
              </button>
            </div>
          </>
        ) : null}

        {step === "contract" ? (
          <form
            className="contract-form"
            onSubmit={(event) => {
              event.preventDefault();
              startQuiz();
            }}
          >
            <div className="contract-document">
              <img
                src={language === "th" ? "/assets/contract_form_th.png" : "/assets/contract_form_en.png"}
                alt={copy.contractAlt}
                draggable={false}
              />
              <label className="contract-field contract-field-name" aria-label="Name">
                <input value={guestName} onChange={(event) => setGuestName(event.target.value)} autoFocus />
              </label>
              <label className="contract-field contract-field-date" aria-label="Date">
                <input value={answeredDate} readOnly />
              </label>
              {errorMessage ? <p className="invitation-error contract-error">{errorMessage}</p> : null}
            </div>
            <button className="contract-sign-button" type="submit" disabled={!guestName.trim() || !answeredDate.trim()}>
              {copy.signContract}
            </button>
          </form>
        ) : null}

        {step === "quiz" && activeQuestion ? (
          <div className="questionnaire-panel">
            <div className="questionnaire-progress">
              {copy.question} {activeQuestionIndex + 1} / {questions.length}
            </div>
            <h1>{activeQuestion.text[language]}</h1>
            <div className="questionnaire-choices">
              {activeQuestion.choices.map((choice) => (
                <button
                  key={choice.id}
                  className={answersByQuestionId[activeQuestion.id] === choice.id ? "questionnaire-choice-selected" : ""}
                  type="button"
                  onClick={() => handleChoiceSelect(activeQuestion, choice)}
                >
                  <strong>{choice.label}</strong>
                  <span>{choice.text[language]}</span>
                </button>
              ))}
            </div>
            <div className="questionnaire-footer">
              <span>
                {answeredCount} / {questions.length} {copy.answered}
              </span>
              <button type="button" disabled={!isQuizComplete || isSubmitting} onClick={submitQuiz}>
                {isSubmitting ? copy.sealing : copy.revealResult}
              </button>
            </div>
          </div>
        ) : null}

        {step === "result" && result ? (
          <div className="invitation-result-shell">
            <div className="invitation-result-card" ref={resultCardRef}>
              <img className="invitation-result-image" src={hostResultImageByKey[result.winningRoom]} alt="" />
              <div className="invitation-result-content">
                <p>{copy.wing}</p>
                <h1>{hostWingLabels[language][result.winningRoom]}</h1>
                <span>
                  {copy.host} {hostLabels[result.winningRoom]}
                </span>
                <div className="invitation-result-graphs">
                  <div className="invitation-graph-card">
                    <p>{copy.yourScore}</p>
                    <ScoreRadar scores={result.scores} label={copy.scoreRadarLabel} />
                  </div>
                  <div className="invitation-graph-card">
                    <p>{copy.comparison}</p>
                    <PercentRadar percentages={result.comparisonPercentages} label={copy.comparisonRadarLabel} />
                  </div>
                </div>
                <div className="invitation-code-block">
                  <p>{copy.invitationCode}</p>
                  <strong>{result.invitationCode}</strong>
                </div>
              </div>
            </div>
            <div className="invitation-actions">
              <button type="button" onClick={copyCode}>
                {copy.copyCode}
              </button>
              <button type="button" onClick={saveResultImage}>
                <Download size={16} aria-hidden="true" />
                {copy.saveResult}
              </button>
              <button type="button" onClick={() => onResultClosed(result.winningRoom)}>
                {copy.enter}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default InvitationFlow;
