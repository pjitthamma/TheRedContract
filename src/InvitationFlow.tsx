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
  return {
    guestName,
    answeredDate,
    answers,
    scores,
    winningRoom,
    invitationCode: fallbackInvitationCodes[winningRoom][0],
  };
};

function ScoreRadar({ scores }: { scores: HostScoreMap }) {
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
    <svg className="invitation-radar" viewBox="0 0 164 164" role="img" aria-label="BDSM host score radar">
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
    if (!guestName.trim()) {
      setErrorMessage("Please enter your name before signing the contract.");
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
      setExitMessage(choice.feedback?.[language] || "you are too young");
      window.setTimeout(() => {
        onTooYoung();
      }, 1400);
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
      <section className={`invitation-panel invitation-panel-${step}`} aria-live="polite">
        {exitMessage ? <div className="invitation-exit-message">{exitMessage}</div> : null}

        {step === "code-prompt" ? (
          <>
            <button className="invitation-close" type="button" aria-label="Close" onClick={onCancel}>
              <X size={18} aria-hidden="true" />
            </button>
            <h1>Do you has an invitation code?</h1>
            <div className="invitation-actions">
              <button type="button" onClick={onExistingCode}>
                Yes
              </button>
              <button type="button" onClick={startNewUserFlow}>
                No
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
            <h1>The Red Contract</h1>
            <label>
              <span>Name</span>
              <input value={guestName} onChange={(event) => setGuestName(event.target.value)} autoFocus />
            </label>
            <label>
              <span>Date</span>
              <input value={answeredDate} readOnly />
            </label>
            {errorMessage ? <p className="invitation-error">{errorMessage}</p> : null}
            <button type="submit">Sign Contract</button>
          </form>
        ) : null}

        {step === "quiz" && activeQuestion ? (
          <div className="questionnaire-panel">
            <div className="questionnaire-progress">
              Question {activeQuestionIndex + 1} / {questions.length}
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
                {answeredCount} / {questions.length} answered
              </span>
              <button type="button" disabled={!isQuizComplete || isSubmitting} onClick={submitQuiz}>
                {isSubmitting ? "Sealing..." : "Reveal Result"}
              </button>
            </div>
          </div>
        ) : null}

        {step === "result" && result ? (
          <div className="invitation-result-shell">
            <div className="invitation-result-card" ref={resultCardRef}>
              <img src={hostResultImageByKey[result.winningRoom]} alt="" />
              <div className="invitation-result-content">
                <span>Your Host</span>
                <h1>{hostLabels[result.winningRoom]}</h1>
                <ScoreRadar scores={result.scores} />
                <p>Invitation Code</p>
                <strong>{result.invitationCode}</strong>
              </div>
            </div>
            <div className="invitation-actions">
              <button type="button" onClick={copyCode}>
                Copy Code
              </button>
              <button type="button" onClick={saveResultImage}>
                <Download size={16} aria-hidden="true" />
                Save Image
              </button>
              <button type="button" onClick={() => onResultClosed(result.winningRoom)}>
                Enter
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default InvitationFlow;
