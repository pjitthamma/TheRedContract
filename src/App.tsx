import { ArrowLeft, Volume2, VolumeX, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { type HotspotAction, type SceneId, scenes } from "./scenes";

type PopupContent = {
  title: string;
  body: string;
};

type TransitionPhase = "idle" | "playing" | "revealing";

function App() {
  const [sceneId, setSceneId] = useState<SceneId>("atrium");
  const [popup, setPopup] = useState<PopupContent | null>(null);
  const [imageOverlaySrc, setImageOverlaySrc] = useState<string | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>("idle");
  const [isHotspotAudioPlaying, setIsHotspotAudioPlaying] = useState(false);
  const displayedScene = transitionPhase !== "idle" ? scenes.archive : scenes[sceneId];
  const isTransitioning = transitionPhase !== "idle";

  const canGoBack = displayedScene.id !== "atrium";

  const handleHotspot = (action: HotspotAction) => {
    if (action.type === "popup") {
      setPopup({ title: action.title, body: action.body });
      return;
    }

    if (action.type === "image") {
      if (action.audioSrc) {
        void new Audio(action.audioSrc).play();
      }
      setImageOverlaySrc(action.imageSrc);
      return;
    }

    if (action.type === "audio") {
      if (isHotspotAudioPlaying) {
        return;
      }

      const audio = new Audio(action.src);
      setIsHotspotAudioPlaying(true);
      audio.addEventListener(
        "ended",
        () => {
          setIsHotspotAudioPlaying(false);
        },
        { once: true },
      );
      audio.addEventListener(
        "error",
        () => {
          setIsHotspotAudioPlaying(false);
        },
        { once: true },
      );
      void audio.play().catch(() => setIsHotspotAudioPlaying(false));
      return;
    }

    setPopup(null);

    if (sceneId === "atrium" && action.target === "archive") {
      void new Audio("/assets/whoosp.mp3").play();
      setTransitionPhase("playing");
      return;
    }

    setSceneId(action.target);
  };

  const hotspotButtons = useMemo(
    () =>
      displayedScene.hotspots.map((hotspot) => (
        <button
          className="hotspot"
          data-hotspot-id={hotspot.id}
          key={hotspot.id}
          style={{
            left: `${hotspot.x}%`,
            top: `${hotspot.y}%`,
            width: `${hotspot.width}%`,
            height: `${hotspot.height}%`,
          }}
          type="button"
          disabled={isTransitioning || (hotspot.action.type === "audio" && isHotspotAudioPlaying)}
          aria-label={hotspot.label}
          onClick={() => handleHotspot(hotspot.action)}
        >
          <span>{hotspot.label}</span>
        </button>
      )),
    [displayedScene.hotspots, isHotspotAudioPlaying, isTransitioning],
  );

  const finishTransition = () => {
    setTransitionPhase("revealing");
  };

  const completeReveal = () => {
    setSceneId("archive");
    setTransitionPhase("idle");
  };

  return (
    <main className="game-shell">
      <section
        className={`scene-stage${isTransitioning ? " scene-stage-transitioning" : ""}`}
        style={{ "--scene-aspect-ratio": displayedScene.aspectRatio } as CSSProperties}
        aria-label={displayedScene.name || "Atrium"}
      >
        <VideoScene sceneId={displayedScene.id} src={displayedScene.videoSrc} fallbackClassName={displayedScene.fallbackClassName} />
        <div className="scene-coordinate-layer">
          <div className="hotspot-layer">{hotspotButtons}</div>
          {displayedScene.id === "atrium" ? (
            <img className="invitation-sign-overlay" src="/assets/invitation-sign.png" alt="" aria-hidden="true" />
          ) : null}
        </div>

        <div className="top-bar">
          {canGoBack ? (
            <button
              className="icon-button"
              type="button"
              aria-label="Back to atrium"
              onClick={() => {
                setTransitionPhase("idle");
                setSceneId("atrium");
              }}
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          ) : (
            <span className="top-bar-spacer" />
          )}
          {displayedScene.name ? <p>{displayedScene.name}</p> : <span />}
          <SoundButton />
        </div>

        {isTransitioning ? (
          <TransitionVideo
            phase={transitionPhase}
            onFinish={finishTransition}
            onRevealComplete={completeReveal}
          />
        ) : null}
      </section>

      {popup ? (
        <div className="dialog-backdrop" role="presentation" onClick={() => setPopup(null)}>
          <dialog className="dialog-card" aria-labelledby="dialog-title" open onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" aria-label="Close popup" onClick={() => setPopup(null)}>
              <X size={18} aria-hidden="true" />
            </button>
            <h1 id="dialog-title">{popup.title}</h1>
            <p>{popup.body}</p>
          </dialog>
        </div>
      ) : null}

      {imageOverlaySrc ? (
        <div className="image-backdrop" role="presentation" onClick={() => setImageOverlaySrc(null)}>
          <img
            className="image-overlay"
            src={imageOverlaySrc}
            alt=""
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </main>
  );
}

type TransitionVideoProps = {
  phase: TransitionPhase;
  onFinish: () => void;
  onRevealComplete: () => void;
};

function TransitionVideo({ phase, onFinish, onRevealComplete }: TransitionVideoProps) {
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    if (!videoFailed) {
      return;
    }

    const fallbackTimer = window.setTimeout(onFinish, 450);
    return () => window.clearTimeout(fallbackTimer);
  }, [onFinish, videoFailed]);

  useEffect(() => {
    if (phase !== "revealing") {
      return;
    }

    const revealTimer = window.setTimeout(onRevealComplete, 900);
    return () => window.clearTimeout(revealTimer);
  }, [onRevealComplete, phase]);

  return (
    <div
      className={`transition-overlay${phase === "revealing" ? " transition-overlay-revealing" : ""}${
        videoFailed ? " transition-overlay-fallback" : ""
      }`}
      aria-hidden="true"
    >
      {!videoFailed ? (
        <video
          className="transition-video"
          src="/assets/transition.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={onFinish}
          onError={() => setVideoFailed(true)}
        />
      ) : null}
    </div>
  );
}

function SoundButton() {
  const [isSoundOn, setIsSoundOn] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/assets/sound.wav");
    audio.loop = true;
    audioRef.current = audio;

    void audio.play().catch(() => {
      // Browsers can block unmuted autoplay until the first user gesture.
      setIsSoundOn(false);
    });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleSound = () => {
    const audio = audioRef.current ?? new Audio("/assets/sound.wav");
    audio.loop = true;
    audioRef.current = audio;

    if (isSoundOn) {
      audio.pause();
      setIsSoundOn(false);
      return;
    }

    void audio.play().then(() => setIsSoundOn(true));
  };

  return (
    <button
      className="icon-button"
      type="button"
      aria-label={isSoundOn ? "Turn sound off" : "Turn sound on"}
      title={isSoundOn ? "Turn sound off" : "Turn sound on"}
      onClick={toggleSound}
    >
      {isSoundOn ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
    </button>
  );
}

type VideoSceneProps = {
  sceneId: SceneId;
  src: string;
  fallbackClassName: string;
};

function VideoScene({ sceneId, src, fallbackClassName }: VideoSceneProps) {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <>
      <div className={`animated-fallback ${fallbackClassName}`} aria-hidden="true" />
      {!videoFailed ? (
        <video
          key={sceneId}
          className="scene-video"
          src={src}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
        />
      ) : null}
    </>
  );
}

export default App;
