import { ArrowLeft, Volume2, VolumeX, X } from "lucide-react";
import type { CSSProperties, PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { type HotspotAction, type SceneId, scenes } from "./scenes";

type PopupContent = {
  title: string;
  body: string;
};

type TransitionPhase = "idle" | "playing" | "revealing";

type ClickCounts = {
  door: number;
  poster: number;
  knock: number;
  card: number;
  clubVisited: number;
};

type EventName = "club_visited" | "door_clicked" | "poster_clicked" | "door_knocked" | "card_clicked";

const SESSION_ID_KEY = "red-contract-session-id";

const getSessionId = () => {
  const existingSessionId = window.localStorage.getItem(SESSION_ID_KEY);
  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = window.crypto.randomUUID();
  window.localStorage.setItem(SESSION_ID_KEY, sessionId);
  return sessionId;
};

const mapCounts = (counts?: Partial<Record<EventName, number>>): ClickCounts => ({
  door: counts?.door_clicked ?? 0,
  poster: counts?.poster_clicked ?? 0,
  knock: counts?.door_knocked ?? 0,
  card: counts?.card_clicked ?? 0,
  clubVisited: counts?.club_visited ?? 0,
});

function App() {
  const [sceneId, setSceneId] = useState<SceneId>("atrium");
  const [popup, setPopup] = useState<PopupContent | null>(null);
  const [imageOverlaySrc, setImageOverlaySrc] = useState<string | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>("idle");
  const [transitionTargetSceneId, setTransitionTargetSceneId] = useState<SceneId>("archive");
  const [transitionVideoSrc, setTransitionVideoSrc] = useState("/assets/transition1.mp4");
  const [scenePlaybackKey, setScenePlaybackKey] = useState(0);
  const [isHotspotAudioPlaying, setIsHotspotAudioPlaying] = useState(false);
  const [scenePan, setScenePan] = useState({ x: 0, y: 0 });
  const [isDraggingScene, setIsDraggingScene] = useState(false);
  const dragStartRef = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number; moved: boolean } | null>(
    null,
  );
  const visitTrackedRef = useRef(false);
  const [clickCounts, setClickCounts] = useState<ClickCounts>({
    door: 0,
    poster: 0,
    knock: 0,
    card: 0,
    clubVisited: 0,
  });
  const displayedScene = transitionPhase !== "idle" ? scenes[transitionTargetSceneId] : scenes[sceneId];
  const isTransitioning = transitionPhase !== "idle";

  const canGoBack = displayedScene.id !== "atrium";
  const sceneStyle = {
    "--scene-aspect-ratio": displayedScene.aspectRatio,
    "--scene-pan-x": `${scenePan.x}px`,
    "--scene-pan-y": `${scenePan.y}px`,
  } as CSSProperties;

  const clampScenePan = (x: number, y: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const sceneWidth = Math.max(viewportWidth, viewportHeight * displayedScene.aspectRatio);
    const sceneHeight = Math.max(viewportHeight, viewportWidth / displayedScene.aspectRatio);
    const maxX = Math.max(0, (sceneWidth - viewportWidth) / 2);
    const maxY = Math.max(0, (sceneHeight - viewportHeight) / 2);

    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const canDragScene = () => window.matchMedia("(max-width: 720px)").matches;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const resetDesktopPan = () => {
      if (!mediaQuery.matches) {
        setScenePan({ x: 0, y: 0 });
      }
    };

    resetDesktopPan();
    mediaQuery.addEventListener("change", resetDesktopPan);
    return () => mediaQuery.removeEventListener("change", resetDesktopPan);
  }, []);

  const fetchCounts = async () => {
    const response = await fetch("/.netlify/functions/get-counts");
    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { counts?: Partial<Record<EventName, number>> };
    setClickCounts(mapCounts(data.counts));
  };

  const trackEvent = async (eventName: EventName) => {
    setClickCounts((current) => {
      if (eventName === "club_visited") {
        return { ...current, clubVisited: current.clubVisited + 1 };
      }
      if (eventName === "door_clicked") {
        return { ...current, door: current.door + 1 };
      }
      if (eventName === "poster_clicked") {
        return { ...current, poster: current.poster + 1 };
      }
      if (eventName === "door_knocked") {
        return { ...current, knock: current.knock + 1 };
      }
      return { ...current, card: current.card + 1 };
    });

    try {
      const response = await fetch("/.netlify/functions/track-event", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          eventName,
          sessionId: getSessionId(),
        }),
      });

      if (response.ok) {
        await fetchCounts();
      }
    } catch {
      // Keep optimistic local counts if tracking is unavailable.
    }
  };

  useEffect(() => {
    if (visitTrackedRef.current) {
      return;
    }

    visitTrackedRef.current = true;
    void fetchCounts().then(() => trackEvent("club_visited"));
  }, []);

  const handleHotspot = (hotspotId: string, action: HotspotAction) => {
    if (action.type === "popup") {
      setPopup({ title: action.title, body: action.body });
      return;
    }

    if (action.type === "image") {
      if (dragStartRef.current?.moved) {
        return;
      }
      if (hotspotId === "atrium-poster") {
        void trackEvent("poster_clicked");
      }
      if (action.audioSrc) {
        void new Audio(action.audioSrc).play();
      }
      setImageOverlaySrc(action.imageSrc);
      return;
    }

    if (action.type === "audio") {
      if (dragStartRef.current?.moved) {
        return;
      }
      if (isHotspotAudioPlaying) {
        return;
      }

      if (hotspotId === "archive-outside-card" || hotspotId === "door-outside-handle") {
        void trackEvent("door_knocked");
      }
      if (hotspotId === "card") {
        void trackEvent("card_clicked");
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

    if (dragStartRef.current?.moved) {
      return;
    }

    if (sceneId === "atrium" && action.target === "door") {
      void trackEvent("door_clicked");
      void new Audio("/assets/whoosp.mp3").play();
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("door");
      setTransitionVideoSrc("/assets/transition1.mp4");
      setTransitionPhase("playing");
      return;
    }

    if (sceneId === "door" && action.target === "archive") {
      void new Audio("/assets/door-open.mp3").play();
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("archive");
      setTransitionVideoSrc("/assets/transition2.mp4");
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
          onClick={() => handleHotspot(hotspot.id, hotspot.action)}
        >
          <span>{hotspot.label}</span>
        </button>
      )),
    [displayedScene.hotspots, isHotspotAudioPlaying, isTransitioning, sceneId],
  );

  const sceneOverlays = useMemo(
    () =>
      displayedScene.overlays?.map((overlay) => (
        <button
          className="scene-overlay-hotspot"
          data-overlay-id={overlay.id}
          key={overlay.id}
          style={{
            left: `${overlay.x}%`,
            top: `${overlay.y}%`,
            width: `${overlay.width}%`,
          }}
          type="button"
          aria-label={overlay.label}
        >
          <img src={overlay.src} alt="" aria-hidden="true" draggable={false} />
        </button>
      )) ?? [],
    [displayedScene.overlays],
  );

  const finishTransition = () => {
    setTransitionPhase("revealing");
  };

  const completeReveal = () => {
    setSceneId(transitionTargetSceneId);
    setScenePlaybackKey((current) => current + 1);
    setTransitionPhase("idle");
  };

  const handleScenePointerDown = (event: PointerEvent<HTMLElement>) => {
    const target = event.target;
    if (
      isTransitioning ||
      imageOverlaySrc ||
      !canDragScene() ||
      (target instanceof Element && target.closest(".icon-button, .close-button"))
    ) {
      return;
    }

    dragStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: scenePan.x,
      panY: scenePan.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingScene(true);
  };

  const handleScenePointerMove = (event: PointerEvent<HTMLElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = dragStart.x - event.clientX;
    const deltaY = dragStart.y - event.clientY;
    if (Math.hypot(deltaX, deltaY) > 8) {
      dragStart.moved = true;
    }

    setScenePan(clampScenePan(dragStart.panX - deltaX, dragStart.panY - deltaY));
  };

  const handleScenePointerUp = (event: PointerEvent<HTMLElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStartRef.current = dragStart.moved ? dragStart : null;
    setIsDraggingScene(false);
    setScenePan((current) => clampScenePan(current.x, current.y));

    if (dragStart.moved) {
      window.setTimeout(() => {
        if (dragStartRef.current === dragStart) {
          dragStartRef.current = null;
        }
      }, 0);
    }
  };

  return (
    <main className="game-shell">
      <section
        className={`scene-stage${isTransitioning ? " scene-stage-transitioning" : ""}${
          isDraggingScene ? " scene-stage-dragging" : ""
        }`}
        style={sceneStyle}
        onPointerDown={handleScenePointerDown}
        onPointerMove={handleScenePointerMove}
        onPointerUp={handleScenePointerUp}
        onPointerCancel={handleScenePointerUp}
        onLostPointerCapture={handleScenePointerUp}
        aria-label={displayedScene.name || "Atrium"}
      >
        <VideoScene
          sceneId={displayedScene.id}
          playbackKey={scenePlaybackKey}
          shouldPlay={!isTransitioning}
          src={displayedScene.videoSrc}
          posterSrc={displayedScene.posterSrc}
          fallbackClassName={displayedScene.fallbackClassName}
        />
        <div className="scene-coordinate-layer">
          <div className="hotspot-layer">{hotspotButtons}</div>
          <div className="scene-overlay-layer">{sceneOverlays}</div>
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
                setScenePan({ x: 0, y: 0 });
                setSceneId("atrium");
                setTransitionTargetSceneId("archive");
              }}
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          ) : (
            <span className="top-bar-spacer" />
          )}
          <ClickCounter sceneId={displayedScene.id} counts={clickCounts} />
          <SoundButton />
        </div>

        {isTransitioning ? (
          <TransitionVideo
            phase={transitionPhase}
            src={transitionVideoSrc}
            onFinish={finishTransition}
            onRevealComplete={completeReveal}
          />
        ) : null}

        {displayedScene.id === "atrium" ? (
          <div className="club-counter">Club Visited: {clickCounts.clubVisited}</div>
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

type ClickCounterProps = {
  sceneId: SceneId;
  counts: ClickCounts;
};

function ClickCounter({ sceneId, counts }: ClickCounterProps) {
  if (sceneId === "door") {
    return (
      <div className="click-counter" aria-live="polite">
        <span>Door Knocked: {counts.knock}</span>
      </div>
    );
  }

  if (sceneId !== "atrium") {
    return <span className="top-bar-spacer" aria-hidden="true" />;
  }

  return (
    <div className="click-counter" aria-live="polite">
      <span>Door Clicked: {counts.door}</span>
      <span>Poster Clicked: {counts.poster}</span>
    </div>
  );
}

type TransitionVideoProps = {
  phase: TransitionPhase;
  src: string;
  onFinish: () => void;
  onRevealComplete: () => void;
};

function TransitionVideo({ phase, src, onFinish, onRevealComplete }: TransitionVideoProps) {
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
          key={src}
          className="transition-video"
          src={src}
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
    const audio = new Audio("/assets/sound.mp3");
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
    const audio = audioRef.current ?? new Audio("/assets/sound.mp3");
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
  playbackKey: number;
  shouldPlay: boolean;
  src: string;
  posterSrc?: string;
  fallbackClassName: string;
};

function VideoScene({ sceneId, playbackKey, shouldPlay, src, posterSrc, fallbackClassName }: VideoSceneProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    setVideoFailed(false);
    setVideoReady(false);
  }, [sceneId, src]);

  return (
    <div className="scene-media-layer">
      <div className={`animated-fallback ${fallbackClassName}`} aria-hidden="true" />
      {posterSrc ? <img className="scene-poster" src={posterSrc} alt="" aria-hidden="true" /> : null}
      {!videoFailed ? (
        <video
          key={`${sceneId}-${playbackKey}`}
          className={`scene-video${videoReady ? " scene-video-ready" : ""}`}
          src={src}
          autoPlay={shouldPlay}
          muted
          loop
          playsInline
          poster={posterSrc}
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
        />
      ) : null}
    </div>
  );
}

export default App;
