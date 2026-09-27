import { ArrowLeft, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { apiFetch } from "./api";
import { assetUrl } from "./preloadAssets";
import { navigateTo } from "./navigation";
import { createAudio, releaseAudio, isSoundEnabled, setSoundEnabled, useSoundEnabled } from "./audio";
import { type CSSProperties, type KeyboardEvent, type PointerEvent, useCallback, useEffect, useRef, useState } from "react";

type BotAnimationState = "start" | "end";

type BotClickTestVariant = "b" | "d" | "m" | "s";

type BotClickTestProps = {
  guestNameOverride?: string;
  returnPath?: string;
  variant: BotClickTestVariant;
};

type BotClickTestConfig = {
  backgroundSrc: string;
  hitboxClassName: string;
  moanSrc?: string;
  musicSrc: string;
  sideVideoSrc: string;
  videoSrcByState: Record<BotAnimationState, string>;
};

type LeaderboardEntry = {
  name: string;
  score: number;
};

type LeaderboardResponse = {
  leaderboard?: LeaderboardEntry[];
};

const GUEST_NAME_KEY = "red-contract-guest-name";
const MIN_HIT_INPUT_INTERVAL_MS = 60;

const botClickTestConfigs: Record<BotClickTestVariant, BotClickTestConfig> = {
  b: {
    backgroundSrc: "/assets/splank_b.jpg",
    hitboxClassName: "bot-test-hitbox-b",
    moanSrc: "/assets/moan_b.mp3",
    musicSrc: "/assets/Rosen B.mp3",
    sideVideoSrc: "/assets/b-twerk.webm",
    videoSrcByState: {
      start: "/assets/b-bot-start.mp4",
      end: "/assets/b-bot-end.mp4",
    },
  },
  d: {
    backgroundSrc: "/assets/splank_d.png",
    hitboxClassName: "bot-test-hitbox-d",
    moanSrc: "/assets/moan_d.mp3",
    musicSrc: "/assets/Michael D.mp3",
    sideVideoSrc: "/assets/d-twerk.webm",
    videoSrcByState: {
      start: "/assets/d-top-start.mp4",
      end: "/assets/d-top-end.mp4",
    },
  },
  m: {
    backgroundSrc: "/assets/splank_m.jpg",
    hitboxClassName: "bot-test-hitbox-m",
    moanSrc: "/assets/moan_m.mp3",
    musicSrc: "/assets/Noel M.mp3",
    sideVideoSrc: "/assets/m-twerk.webm",
    videoSrcByState: {
      start: "/assets/m-bot-start.mp4",
      end: "/assets/m-bot-end.mp4",
    },
  },
  s: {
    backgroundSrc: "/assets/splank_s.jpg",
    hitboxClassName: "bot-test-hitbox-s",
    moanSrc: "/assets/moan_s.mp3",
    musicSrc: "/assets/Ryusei S.mp3",
    sideVideoSrc: "/assets/s-twerk.webm",
    videoSrcByState: {
      start: "/assets/s-top-start.mp4",
      end: "/assets/s-top-end.mp4",
    },
  },
};

const getStoredGuestName = () => window.localStorage.getItem(GUEST_NAME_KEY)?.trim().slice(0, 20) || "Guest";
function BotClickTest({ guestNameOverride, returnPath = "/", variant }: BotClickTestProps) {
  const config = botClickTestConfigs[variant];
  const [guestName] = useState(() => guestNameOverride?.trim().slice(0, 20) || getStoredGuestName());
  const [clickCount, setClickCount] = useState(0);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [animationState, setAnimationState] = useState<BotAnimationState>("start");
  const isMusicOn = useSoundEnabled();
  const [leaderboardStatus, setLeaderboardStatus] = useState<"loading" | "ready" | "error">("loading");
  const endVideoRef = useRef<HTMLVideoElement | null>(null);
  const moanAudioRef = useRef<HTMLAudioElement | null>(null);
  const moanAudioSrcRef = useRef<string | null>(null);
  const slapAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastAcceptedHitAtRef = useRef(0);

  useEffect(() => {
    const audio = createAudio(config.musicSrc);
    audio.loop = true;
    audio.volume = 0.72;
    musicAudioRef.current = audio;

    if (isMusicOn) {
      void audio.play().catch(() => {});
    }

    return () => {
      releaseAudio(audio);
      if (musicAudioRef.current === audio) {
        musicAudioRef.current = null;
      }
    };
  }, [config.musicSrc]);

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardStatus("loading");
    try {
      const query = new URLSearchParams({
        roomKey: variant,
      });
      const response = await apiFetch(`get-mini-game-leaderboard?${query.toString()}`);
      if (!response.ok) throw new Error("Leaderboard unavailable");

      const data = (await response.json()) as LeaderboardResponse;
      const nextLeaderboardEntries = data.leaderboard ?? [];
      setLeaderboardEntries(nextLeaderboardEntries);
      setLeaderboardStatus("ready");
    } catch {
      setLeaderboardStatus("error");
    }
  }, [variant]);

  useEffect(() => { void fetchLeaderboard(); }, [fetchLeaderboard]);

  useEffect(() => {
    const audio = musicAudioRef.current;
    if (!audio) return;
    if (isMusicOn) void audio.play().catch(() => {});
    else audio.pause();
  }, [isMusicOn]);

  useEffect(() => () => {
    if (slapAudioRef.current) releaseAudio(slapAudioRef.current);
    if (moanAudioRef.current) releaseAudio(moanAudioRef.current);
  }, []);

  const playHitFeedback = () => {
    setAnimationState("end");

    const slapAudio = slapAudioRef.current ?? createAudio("/assets/slap.mp3");
    slapAudioRef.current = slapAudio;
    slapAudio.currentTime = 0;
    void slapAudio.play().catch(() => {});

    if (config.moanSrc) {
      const moanAudio =
        moanAudioRef.current && moanAudioSrcRef.current === config.moanSrc
          ? moanAudioRef.current
          : createAudio(config.moanSrc);
      moanAudioRef.current = moanAudio;
      moanAudioSrcRef.current = config.moanSrc;
      moanAudio.currentTime = 0;
      void moanAudio.play().catch(() => {});
    }

    window.setTimeout(() => {
      const video = endVideoRef.current;
      if (!video) {
        return;
      }

      video.currentTime = 0;
      void video.play().catch(() => setAnimationState("start"));
    }, 0);
  };

  const handleCharacterPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!event.isPrimary) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const now = performance.now();
    if (now - lastAcceptedHitAtRef.current < MIN_HIT_INPUT_INTERVAL_MS) {
      return;
    }
    lastAcceptedHitAtRef.current = now;

    setClickCount((current) => current + 1);
    playHitFeedback();
  };

  const blockKeyboardHit = (event: KeyboardEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const toggleMusic = () => {
    setSoundEnabled(!isSoundEnabled());
    if (isSoundEnabled()) void musicAudioRef.current?.play().catch(() => {});
  };

  return (
    <>
    <main className="bot-test-shell" style={{ "--game-cursor": `url("${assetUrl("/assets/palm.png")}") 24 24, pointer` } as CSSProperties}>
      <div
        className="bot-test-background"
        style={{ backgroundImage: `url("${assetUrl(config.backgroundSrc)}")` }}
        aria-hidden="true"
      />

      <a className="bot-test-back" href={returnPath} onClick={(event) => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigateTo(returnPath); } }} aria-label="Back to host room" title="Back to host room">
        <ArrowLeft size={20} aria-hidden="true" />
      </a>

      <div className="bot-test-player-panel">
        <div className="bot-test-guest-card">
          <span>Guest Name:</span>
          <strong>{guestName}</strong>
        </div>

        <div className="bot-test-score" aria-live="polite">
          <span>Hits</span>
          <strong>{clickCount}</strong>
        </div>

      </div>

      <button
        className="bot-test-music-button"
        type="button"
        aria-label={isMusicOn ? "Turn sound off" : "Turn sound on"}
        title={isMusicOn ? "Turn sound off" : "Turn sound on"}
        onClick={toggleMusic}
      >
        {isMusicOn ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
      </button>

      <video
        className="bot-test-side-video"
        src={assetUrl(config.sideVideoSrc)}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      <aside className="bot-test-leaderboard" aria-label="Leaderboard">
        <div className="bot-test-leaderboard-title">
          <h1>FINAL LEADERBOARD</h1>
          <button type="button" aria-label="Refresh leaderboard" title="Refresh leaderboard" onClick={() => void fetchLeaderboard()}>
            <RefreshCw size={14} aria-hidden="true" />
          </button>
        </div>
        <ol>
          {leaderboardEntries.map((entry, index) => (
            <li key={`${index}-${entry.name}`}>
              <span title={entry.name}>{index + 1}. {entry.name}</span>
              <strong>{entry.score}</strong>
            </li>
          ))}
          {!leaderboardEntries.length ? (
            <li className="bot-test-leaderboard-empty">
              <span>{leaderboardStatus === "loading" ? "Loading final scores…" : leaderboardStatus === "error" ? "Could not load scores. Please retry ↻" : "No recorded scores"}</span>
            </li>
          ) : null}
        </ol>
      </aside>

      <section className="bot-test-stage" aria-label="Character hit test">
        <video
          className="bot-test-video"
          src={assetUrl(config.videoSrcByState.start)}
          poster={assetUrl(config.backgroundSrc)}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />

        <video
          ref={endVideoRef}
          className={`bot-test-video bot-test-video-end${animationState === "end" ? " bot-test-video-active" : ""}`}
          src={assetUrl(config.videoSrcByState.end)}
          muted
          playsInline
          preload="auto"
          onEnded={() => setAnimationState("start")}
        />

        <button
          className={`bot-test-hitbox ${config.hitboxClassName}`}
          type="button"
          aria-label="Hit character"
          tabIndex={-1}
          onClick={(event) => event.preventDefault()}
          onKeyDown={blockKeyboardHit}
          onKeyUp={blockKeyboardHit}
          onPointerDown={handleCharacterPointerDown}
        />
      </section>
    </main>
      <p className="bot-test-event-notice">
        กิจกรรมสิ้นสุดลงแล้ว การเล่นหลังจากนี้จะไม่บันทึกคะแนนหรือเปลี่ยนแปลงอันดับ
        แต่ท่านยังสามารถร่วมสนุกกับมินิเกมตีก้นโฮสต์ได้ตามอัธยาศัย
        <span>The event has ended. Enjoy playing for fun; new hits are not saved and will not affect the final rankings.</span>
      </p>
    </>
  );
}

export default BotClickTest;
