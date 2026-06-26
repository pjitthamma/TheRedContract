import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type BotAnimationState = "start" | "end";

type BotClickTestVariant = "b" | "d" | "m" | "s";

type BotClickTestProps = {
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
  guestScore?: number | null;
  leaderboard?: LeaderboardEntry[];
};

const GUEST_NAME_KEY = "red-contract-guest-name";
const SESSION_KEY = "red-contract-session-id";

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

const getSessionId = () => {
  const existingSessionId = window.localStorage.getItem(SESSION_KEY);
  if (existingSessionId) {
    return existingSessionId;
  }

  const nextSessionId = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, nextSessionId);
  return nextSessionId;
};

function BotClickTest({ returnPath = "/", variant }: BotClickTestProps) {
  const config = botClickTestConfigs[variant];
  const [guestName] = useState(getStoredGuestName);
  const [clickCount, setClickCount] = useState(0);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [animationState, setAnimationState] = useState<BotAnimationState>("start");
  const [isMusicOn, setIsMusicOn] = useState(true);
  const endVideoRef = useRef<HTMLVideoElement | null>(null);
  const moanAudioRef = useRef<HTMLAudioElement | null>(null);
  const moanAudioSrcRef = useRef<string | null>(null);
  const slapAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasLoadedSavedScoreRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(config.musicSrc);
    audio.loop = true;
    audio.volume = 0.72;
    musicAudioRef.current = audio;

    if (isMusicOn) {
      void audio.play().catch(() => setIsMusicOn(false));
    }

    return () => {
      audio.pause();
      if (musicAudioRef.current === audio) {
        musicAudioRef.current = null;
      }
    };
  }, [config.musicSrc]);

  const fetchLeaderboard = async () => {
    try {
      const query = new URLSearchParams({
        guestName,
        roomKey: variant,
      });
      const response = await fetch(`/.netlify/functions/get-mini-game-leaderboard?${query.toString()}`);
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as LeaderboardResponse;
      const nextLeaderboardEntries = data.leaderboard ?? [];
      setLeaderboardEntries(nextLeaderboardEntries);

      const savedGuestScore =
        typeof data.guestScore === "number"
          ? data.guestScore
          : nextLeaderboardEntries.find((entry) => entry.name.trim().toLocaleLowerCase() === guestName.toLocaleLowerCase())
              ?.score;

      if (typeof savedGuestScore === "number") {
        setClickCount((current) => Math.max(current, savedGuestScore));
      }
    } catch {
      // Local Vite development can keep the current in-memory score visible.
    } finally {
      hasLoadedSavedScoreRef.current = true;
    }
  };

  useEffect(() => {
    hasLoadedSavedScoreRef.current = false;
    void fetchLeaderboard();
  }, [guestName, variant]);

  useEffect(() => {
    if (!hasLoadedSavedScoreRef.current || clickCount <= 0) {
      return;
    }

    const submitTimer = window.setTimeout(() => {
      void fetch("/.netlify/functions/submit-mini-game-score", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          roomKey: variant,
          guestName,
          clickCount,
          sessionId: getSessionId(),
        }),
      })
        .then(() => fetchLeaderboard())
        .catch(() => {
          // Keep clicks playable when the database is unavailable.
        });
    }, 350);

    return () => window.clearTimeout(submitTimer);
  }, [clickCount, guestName, variant]);

  const handleCharacterHit = () => {
    setClickCount((current) => current + 1);
    setAnimationState("end");

    const slapAudio = slapAudioRef.current ?? new Audio("/assets/slap.mp3");
    slapAudioRef.current = slapAudio;
    slapAudio.currentTime = 0;
    void slapAudio.play();

    if (config.moanSrc) {
      const moanAudio =
        moanAudioRef.current && moanAudioSrcRef.current === config.moanSrc
          ? moanAudioRef.current
          : new Audio(config.moanSrc);
      moanAudioRef.current = moanAudio;
      moanAudioSrcRef.current = config.moanSrc;
      moanAudio.currentTime = 0;
      void moanAudio.play();
    }

    window.setTimeout(() => {
      const video = endVideoRef.current;
      if (!video) {
        return;
      }

      video.currentTime = 0;
      void video.play();
    }, 0);
  };

  const toggleMusic = () => {
    const audio = musicAudioRef.current ?? new Audio(config.musicSrc);
    audio.loop = true;
    audio.volume = 0.72;
    musicAudioRef.current = audio;

    if (isMusicOn) {
      audio.pause();
      setIsMusicOn(false);
      return;
    }

    void audio.play().then(() => setIsMusicOn(true));
  };

  return (
    <main className="bot-test-shell">
      <div
        className="bot-test-background"
        style={{ backgroundImage: `url("${config.backgroundSrc}")` }}
        aria-hidden="true"
      />

      <a className="bot-test-back" href={returnPath} aria-label="Back to host room" title="Back to host room">
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
        aria-label={isMusicOn ? "Turn music off" : "Turn music on"}
        title={isMusicOn ? "Turn music off" : "Turn music on"}
        onClick={toggleMusic}
      >
        {isMusicOn ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
      </button>

      <video
        className="bot-test-side-video"
        src={config.sideVideoSrc}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      <aside className="bot-test-leaderboard" aria-label="Leaderboard">
        <h1>Leaderboard</h1>
        <ol>
          {leaderboardEntries.map((entry) => (
            <li key={`${entry.name}-${entry.score}`}>
              <span>{entry.name}</span>
              <strong>{entry.score}</strong>
            </li>
          ))}
          {!leaderboardEntries.length ? (
            <li>
              <span>{guestName}</span>
              <strong>{clickCount}</strong>
            </li>
          ) : null}
        </ol>
      </aside>

      <section className="bot-test-stage" aria-label="Character hit test">
        <video
          className="bot-test-video"
          src={config.videoSrcByState.start}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />

        <video
          ref={endVideoRef}
          className={`bot-test-video bot-test-video-end${animationState === "end" ? " bot-test-video-active" : ""}`}
          src={config.videoSrcByState.end}
          muted
          playsInline
          preload="auto"
          onEnded={() => setAnimationState("start")}
        />

        <button
          className={`bot-test-hitbox ${config.hitboxClassName}`}
          type="button"
          aria-label="Hit character"
          onClick={handleCharacterHit}
        />
      </section>
    </main>
  );
}

export default BotClickTest;
