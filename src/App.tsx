import { ArrowLeft, Volume2, VolumeX, X } from "lucide-react";
import { useMemo, useState } from "react";
import { type HotspotAction, type SceneId, scenes } from "./scenes";

type PopupContent = {
  title: string;
  body: string;
};

function App() {
  const [sceneId, setSceneId] = useState<SceneId>("atrium");
  const [popup, setPopup] = useState<PopupContent | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const scene = scenes[sceneId];

  const canGoBack = sceneId !== "atrium";

  const handleHotspot = (action: HotspotAction) => {
    if (action.type === "popup") {
      setPopup({ title: action.title, body: action.body });
      return;
    }

    setPopup(null);
    setSceneId(action.target);
  };

  const hotspotButtons = useMemo(
    () =>
      scene.hotspots.map((hotspot) => (
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
          aria-label={hotspot.label}
          title={hotspot.label}
          onClick={() => handleHotspot(hotspot.action)}
        >
          <span>{hotspot.label}</span>
        </button>
      )),
    [scene.hotspots],
  );

  return (
    <main className="game-shell">
      <section className="scene-stage" aria-label={scene.name}>
        <VideoScene sceneId={scene.id} src={scene.videoSrc} fallbackClassName={scene.fallbackClassName} isMuted={isMuted} />
        <div className="hotspot-layer">{hotspotButtons}</div>
        {scene.id === "atrium" ? (
          <img className="invitation-sign-overlay" src="/assets/invitation-sign.png" alt="" aria-hidden="true" />
        ) : null}

        <div className="top-bar">
          {canGoBack ? (
            <button className="icon-button" type="button" aria-label="Back to atrium" onClick={() => setSceneId("atrium")}>
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          ) : (
            <span className="top-bar-spacer" />
          )}
          <p>{scene.name}</p>
          <button
            className="icon-button"
            type="button"
            aria-label={isMuted ? "Turn sound on" : "Turn sound off"}
            title={isMuted ? "Turn sound on" : "Turn sound off"}
            onClick={() => setIsMuted((current) => !current)}
          >
            {isMuted ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
          </button>
        </div>
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
    </main>
  );
}

type VideoSceneProps = {
  sceneId: SceneId;
  src: string;
  fallbackClassName: string;
  isMuted: boolean;
};

function VideoScene({ sceneId, src, fallbackClassName, isMuted }: VideoSceneProps) {
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
          muted={isMuted}
          loop
          playsInline
          onError={() => setVideoFailed(true)}
        />
      ) : null}
    </>
  );
}

export default App;
