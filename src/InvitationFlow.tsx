import { Download, X } from "lucide-react";
import { toBlob } from "html-to-image";
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
  playToken?: string;
};

type SaveFilePicker = {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
};

type WritableFileHandle = {
  createWritable: () => Promise<{
    write: (blob: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

type NavigatorWithShareFiles = Navigator & {
  canShare?: (data: ShareData) => boolean;
};

type WindowWithSavePicker = Window & {
  showSaveFilePicker?: (options: SaveFilePicker) => Promise<WritableFileHandle>;
};

const emptyScores = (): HostScoreMap => ({ b: 0, d: 0, s: 0, m: 0 });
const LOCAL_INVITATION_RESULTS_KEY = "red-contract-local-invitation-results";

const rememberInvitationResult = (result: InvitationResult) => {
  try {
    const existingResults = JSON.parse(window.localStorage.getItem(LOCAL_INVITATION_RESULTS_KEY) ?? "[]") as InvitationResult[];
    const storedResult: InvitationResult = { ...result, playToken: undefined };
    const nextResults = [
      storedResult,
      ...existingResults.filter(
        (item) =>
          !(
            item.guestName.trim().toLocaleLowerCase() === result.guestName.trim().toLocaleLowerCase() &&
            item.winningRoom === result.winningRoom &&
            item.invitationCode.trim().toLocaleLowerCase() === result.invitationCode.trim().toLocaleLowerCase()
          ),
      ),
    ].slice(0, 40);
    window.localStorage.setItem(LOCAL_INVITATION_RESULTS_KEY, JSON.stringify(nextResults));
  } catch {
    // Local recovery is only for browser testing; Supabase remains the source of truth.
  }
};

const shuffleQuestions = (questions: QuestionnaireQuestion[]) => {
  const shuffled = questions.map((question) => ({
    ...question,
    choices: shuffleChoices(question.choices),
  }));
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const shuffleChoices = (choices: QuestionnaireChoice[]) => {
  const shuffled = [...choices];
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

const playWelcomeSound = () => {
  void new Audio("/assets/Welcome.mp3").play();
};

const GUEST_NAME_KEY = "red-contract-guest-name";
const getPlayTokenKey = (roomKey: HostKey) => `red-contract-play-token:${roomKey}`;

const invitationCopy = {
  en: {
    invitationQuestion: "Do you has an invitation code?",
    yes: "Yes",
    no: "No",
    checkingName: "Checking name...",
    duplicateName: "This name has already been used.",
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
    checkingName: "กำลังตรวจสอบชื่อ...",
    duplicateName: "ชื่อนี้ถูกลงทะเบียนแล้ว กรุณาใช้ชื่ออื่น",
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

const hostWingLabels: Record<HostKey, string> = {
  b: "B Wing: The Restraint Room",
  d: "D Wing: The Obedience Suite",
  s: "S Wing: The Red Hunt",
  m: "M Wing: The White Room",
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
        <circle key={scale} cx={center} cy={center} r={maxRadius * scale} fill="none" stroke="rgba(255,216,117,0.28)" strokeWidth="1" />
      ))}
      {points.map((point) => (
        <line key={point.host} x1={center} y1={center} x2={point.labelX} y2={point.labelY} stroke="rgba(255,216,117,0.28)" strokeWidth="1" />
      ))}
      <polygon points={polygonPoints} fill="rgba(214,169,74,0.34)" stroke="#d6a94a" strokeWidth="2" />
      {points.map((point) => (
        <text key={point.host} x={point.labelX} y={point.labelY} fill="#fff8cc" fontSize="11.5" fontWeight="800" textAnchor="middle" dominantBaseline="middle">
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
        <circle key={scale} cx={center} cy={center} r={maxRadius * scale} fill="none" stroke="rgba(255,216,117,0.28)" strokeWidth="1" />
      ))}
      {points.map((point) => (
        <line key={point.host} x1={center} y1={center} x2={point.labelX} y2={point.labelY} stroke="rgba(255,216,117,0.28)" strokeWidth="1" />
      ))}
      <polygon points={polygonPoints} fill="rgba(214,169,74,0.34)" stroke="#d6a94a" strokeWidth="2" />
      {points.map((point) => (
        <text key={point.host} x={point.labelX} y={point.labelY} fill="#fff8cc" fontSize="11.5" fontWeight="800" textAnchor="middle" dominantBaseline="middle">
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
  const [copyTooltipVisible, setCopyTooltipVisible] = useState(false);
  const [isCheckingGuestName, setIsCheckingGuestName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resultCardRef = useRef<HTMLDivElement | null>(null);
  const hudCopy = invitationCopy.en;
  const formCopy = invitationCopy[language];

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

  const startQuiz = async () => {
    if (!guestName.trim() || !answeredDate.trim()) {
      setErrorMessage(hudCopy.nameRequired);
      return;
    }

    const normalizedGuestName = guestName.trim().slice(0, 20);
    setIsCheckingGuestName(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/.netlify/functions/check-guest-name", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ guestName: normalizedGuestName }),
      });

      if (response.status === 409) {
        setErrorMessage(formCopy.duplicateName);
        return;
      }

      if (!response.ok) {
        setErrorMessage("Could not check this guest name. Please try again.");
        return;
      }

      setAnswersByQuestionId({});
      setQuestions(shuffleQuestions(fallbackQuestionnaire));
      setStep("quiz");
    } catch {
      setErrorMessage("Could not check this guest name. Please try again.");
    } finally {
      setIsCheckingGuestName(false);
    }
  };

  const handleChoiceSelect = (question: QuestionnaireQuestion, choice: QuestionnaireChoice) => {
    if (isQuizComplete || exitMessage) {
      return;
    }

    if (choice.specialAction === "redirect" && choice.specialUrl) {
      window.location.href = choice.specialUrl;
      return;
    }

    if (choice.specialAction === "too_young") {
      setExitMessage(choice.feedback?.[language] || formCopy.tooYoung);
      return;
    }

    setAnswersByQuestionId((current) => ({
      ...current,
      [question.id]: choice.id,
    }));
  };

  const submitQuiz = () => {
    if (!isQuizComplete || isSubmitting) {
      return;
    }

    const fallbackResult = calculateResult(questions, answersByQuestionId, guestName.trim(), answeredDate);
    setErrorMessage(null);
    setResult(fallbackResult);
    setStep("result");
  };

  const saveResultAndEnter = async () => {
    if (!result || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const response = await fetch("/.netlify/functions/submit-questionnaire-result", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          guestName: result.guestName,
          answeredDate: result.answeredDate,
          answers: result.answers,
          invitationCode: result.invitationCode,
          sessionId,
        }),
      });

      if (response.ok) {
        const savedResult = (await response.json()) as InvitationResult;
        rememberInvitationResult(savedResult);
        setResult(savedResult);
        window.localStorage.setItem(GUEST_NAME_KEY, savedResult.guestName.trim().slice(0, 20));
        if (savedResult.playToken) {
          window.sessionStorage.setItem(getPlayTokenKey(savedResult.winningRoom), savedResult.playToken);
        }
        onResultClosed(savedResult.winningRoom);
      } else if (response.status === 409) {
        setErrorMessage(formCopy.duplicateName);
        setStep("contract");
        return;
      } else {
        setErrorMessage("Could not save your result. Please try again.");
      }
    } catch {
      setErrorMessage("Could not save your result. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = async () => {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result.invitationCode);
    setCopyTooltipVisible(true);
    window.setTimeout(() => setCopyTooltipVisible(false), 1400);
  };

  const saveResultImage = async () => {
    if (!resultCardRef.current) {
      return;
    }

    try {
      const fileName = `red-contract-${result?.invitationCode ?? "result"}.png`;
      const blob = await toBlob(resultCardRef.current, { cacheBust: true, pixelRatio: 2 });
      if (!blob) {
        return;
      }

      const savePicker = (window as WindowWithSavePicker).showSaveFilePicker;
      if (savePicker) {
        const handle = await savePicker({
          suggestedName: fileName,
          types: [
            {
              description: "PNG image",
              accept: { "image/png": [".png"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      }

      const file = new File([blob], fileName, { type: "image/png" });
      const shareNavigator = navigator as NavigatorWithShareFiles;
      if (navigator.share && shareNavigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "The Red Contract Result" });
        return;
      }

      const dataUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      throw error;
    }
  };

  const closeExitMessage = () => {
    void new Audio("/assets/door-open.mp3").play();
    onTooYoung();
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
        {exitMessage ? (
          <button className="invitation-exit-message" type="button" onClick={closeExitMessage}>
            <span>{exitMessage}</span>
          </button>
        ) : null}

        {step === "code-prompt" ? (
          <>
            <button className="invitation-close" type="button" aria-label={hudCopy.close} onClick={onCancel}>
              <X size={18} aria-hidden="true" />
            </button>
            <h1>{formCopy.invitationQuestion}</h1>
            <div className="invitation-actions">
              <button
                type="button"
                onClick={() => {
                  playWelcomeSound();
                  onExistingCode();
                }}
              >
                {formCopy.yes}
              </button>
              <button
                type="button"
                onClick={() => {
                  playWelcomeSound();
                  startNewUserFlow();
                }}
              >
                {formCopy.no}
              </button>
            </div>
          </>
        ) : null}

        {step === "contract" ? (
          <form
            className="contract-form"
            onSubmit={(event) => {
              event.preventDefault();
              void startQuiz();
            }}
          >
            <div className="contract-document">
              <img
                src={language === "th" ? "/assets/contract_form_th.png" : "/assets/contract_form_en.png"}
                alt={hudCopy.contractAlt}
                draggable={false}
              />
              <label className="contract-field contract-field-name" aria-label="Name">
                <input
                  value={guestName}
                  maxLength={20}
                  onChange={(event) => setGuestName(event.target.value.slice(0, 20))}
                  autoFocus
                />
              </label>
              <label className="contract-field contract-field-date" aria-label="Date">
                <input value={answeredDate} readOnly />
              </label>
              {errorMessage ? <p className="invitation-error contract-error">{errorMessage}</p> : null}
            </div>
            <button
              className="contract-sign-button"
              type="submit"
              disabled={!guestName.trim() || !answeredDate.trim() || isCheckingGuestName}
            >
              {isCheckingGuestName ? formCopy.checkingName : formCopy.signContract}
            </button>
          </form>
        ) : null}

        {step === "quiz" && activeQuestion ? (
          <div className="questionnaire-panel">
            <div className="questionnaire-progress">
              {formCopy.question} {activeQuestionIndex + 1} / {questions.length}
            </div>
            <h1>{activeQuestion.text[language]}</h1>
            <div className="questionnaire-choices">
              {activeQuestion.choices.map((choice) => (
                <button
                  key={choice.id}
                  className={answersByQuestionId[activeQuestion.id] === choice.id ? "questionnaire-choice-selected" : ""}
                  type="button"
                  disabled={isQuizComplete || Boolean(exitMessage)}
                  onClick={() => handleChoiceSelect(activeQuestion, choice)}
                >
                  <strong>{choice.label}</strong>
                  <span>{choice.text[language]}</span>
                </button>
              ))}
            </div>
            <div className="questionnaire-footer">
              <span>
                {answeredCount} / {questions.length} {formCopy.answered}
              </span>
              <button type="button" disabled={!isQuizComplete || isSubmitting} onClick={submitQuiz}>
                {isSubmitting ? formCopy.sealing : formCopy.revealResult}
              </button>
            </div>
          </div>
        ) : null}

        {step === "result" && result ? (
          <div className="invitation-result-shell">
            <div className="invitation-result-card" ref={resultCardRef}>
              <img className="invitation-result-image" src={hostResultImageByKey[result.winningRoom]} alt="" />
              <div className="invitation-result-content">
                <div className="invitation-result-heading">
                  <p>Wing</p>
                  <h1>{hostWingLabels[result.winningRoom]}</h1>
                  <span>Host {hostLabels[result.winningRoom]}</span>
                </div>
                <div className="invitation-result-graphs">
                  <div className="invitation-graph-card">
                    <ScoreRadar scores={result.scores} label={formCopy.scoreRadarLabel} />
                  </div>
                  <div className="invitation-graph-card">
                    <PercentRadar percentages={result.comparisonPercentages} label={formCopy.comparisonRadarLabel} />
                  </div>
                </div>
                <div className="invitation-code-block">
                  <strong>{result.invitationCode}</strong>
                </div>
              </div>
            </div>
            <div className="invitation-actions">
              {errorMessage ? <p className="invitation-error">{errorMessage}</p> : null}
              <div className="invitation-copy-action">
                <button type="button" onClick={copyCode}>
                  {formCopy.copyCode}
                </button>
                {copyTooltipVisible ? <span className="invitation-copy-tooltip">Code copied!</span> : null}
              </div>
              <button type="button" onClick={saveResultImage}>
                <Download size={16} aria-hidden="true" />
                {formCopy.saveResult}
              </button>
              <button type="button" disabled={isSubmitting} onClick={saveResultAndEnter}>
                {isSubmitting ? formCopy.sealing : formCopy.enter}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default InvitationFlow;
