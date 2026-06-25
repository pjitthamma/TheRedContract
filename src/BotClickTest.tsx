import { ArrowLeft } from "lucide-react";
import { useRef, useState } from "react";

type BotAnimationState = "start" | "end";

const videoSrcByState: Record<BotAnimationState, string> = {
  start: "/assets/d-top-start.mp4",
  end: "/assets/d-top-end.mp4",
};

function BotClickTest() {
  const [clickCount, setClickCount] = useState(0);
  const [animationState, setAnimationState] = useState<BotAnimationState>("start");
  const endVideoRef = useRef<HTMLVideoElement | null>(null);

  const handleCharacterHit = () => {
    setClickCount((current) => current + 1);
    setAnimationState("end");

    window.setTimeout(() => {
      const video = endVideoRef.current;
      if (!video) {
        return;
      }

      video.currentTime = 0;
      void video.play();
    }, 0);
  };

  return (
    <main className="bot-test-shell">
      <a className="bot-test-back" href="/" aria-label="Back to main experience" title="Back to main experience">
        <ArrowLeft size={20} aria-hidden="true" />
      </a>

      <div className="bot-test-score" aria-live="polite">
        <span>Hits</span>
        <strong>{clickCount}</strong>
      </div>

      <section className="bot-test-stage" aria-label="Character hit test">
        <video
          className="bot-test-video"
          src={videoSrcByState.start}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />

        <video
          ref={endVideoRef}
          className={`bot-test-video bot-test-video-end${animationState === "end" ? " bot-test-video-active" : ""}`}
          src={videoSrcByState.end}
          muted
          playsInline
          preload="auto"
          onEnded={() => setAnimationState("start")}
        />

        <button
          className="bot-test-hitbox"
          type="button"
          aria-label="Hit character"
          onClick={handleCharacterHit}
        />
      </section>
    </main>
  );
}

export default BotClickTest;
