import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type BotAnimationState = "start" | "end";

type BotClickTestVariant = "b" | "d" | "m" | "s";

type BotClickTestProps = {
  variant: BotClickTestVariant;
};

type BotClickTestConfig = {
  backgroundSrc: string;
  hitboxClassName: string;
  musicSrc: string;
  sideVideoSrc: string;
  videoSrcByState: Record<BotAnimationState, string>;
};

const botClickTestConfigs: Record<BotClickTestVariant, BotClickTestConfig> = {
  b: {
    backgroundSrc: "/assets/splank_b.jpg",
    hitboxClassName: "bot-test-hitbox-b",
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
    musicSrc: "/assets/Ryusei S.mp3",
    sideVideoSrc: "/assets/s-twerk.webm",
    videoSrcByState: {
      start: "/assets/s-top-start.mp4",
      end: "/assets/s-top-end.mp4",
    },
  },
};

const leaderboardEntries = [
  { name: "You", score: 39 },
  { name: "Guest", score: 28 },
  { name: "Visitor", score: 16 },
];

function BotClickTest({ variant }: BotClickTestProps) {
  const config = botClickTestConfigs[variant];
  const [clickCount, setClickCount] = useState(0);
  const [animationState, setAnimationState] = useState<BotAnimationState>("start");
  const [isMusicOn, setIsMusicOn] = useState(true);
  const endVideoRef = useRef<HTMLVideoElement | null>(null);
  const slapAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

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

  const handleCharacterHit = () => {
    setClickCount((current) => current + 1);
    setAnimationState("end");

    const slapAudio = slapAudioRef.current ?? new Audio("/assets/slap.mp3");
    slapAudioRef.current = slapAudio;
    slapAudio.currentTime = 0;
    void slapAudio.play();

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

      <a className="bot-test-back" href="/" aria-label="Back to main experience" title="Back to main experience">
        <ArrowLeft size={20} aria-hidden="true" />
      </a>

      <div className="bot-test-player-panel">
        <div className="bot-test-guest-card">
          <span>Guest Name:</span>
          <strong>Loading...</strong>
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
            <li key={entry.name}>
              <span>{entry.name}</span>
              <strong>{entry.score}</strong>
            </li>
          ))}
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
