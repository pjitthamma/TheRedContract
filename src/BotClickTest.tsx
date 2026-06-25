import { ArrowLeft } from "lucide-react";
import { useRef, useState } from "react";

type BotAnimationState = "start" | "hit" | "end";

const videoSrcByState: Record<BotAnimationState, string> = {
  start: "/assets/b-bot-start.mp4",
  hit: "/assets/b-bot-hit.mp4",
  end: "/assets/b-bot-end.mp4",
};

function BotClickTest() {
  const [clickCount, setClickCount] = useState(0);
  const [animationState, setAnimationState] = useState<BotAnimationState>("start");
  const hitVideoRef = useRef<HTMLVideoElement | null>(null);

  const handleCharacterHit = () => {
    setClickCount((current) => current + 1);
    setAnimationState("hit");

    window.setTimeout(() => {
      const video = hitVideoRef.current;
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
        {animationState === "start" ? (
          <video
            className="bot-test-video"
            src={videoSrcByState.start}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        ) : null}

        {animationState === "hit" ? (
          <video
            ref={hitVideoRef}
            className="bot-test-video"
            src={videoSrcByState.hit}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={() => setAnimationState("end")}
          />
        ) : null}

        {animationState === "end" ? (
          <video
            className="bot-test-video"
            src={videoSrcByState.end}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        ) : null}

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
