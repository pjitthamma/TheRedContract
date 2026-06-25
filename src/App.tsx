import { ArrowLeft, ArrowUp, ChevronLeft, ChevronRight, Volume2, VolumeX, X } from "lucide-react";
import type { CSSProperties, MouseEvent, PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import BotClickTest from "./BotClickTest";
import { type HotspotAction, type Language, type SceneId, type SceneOverlay, scenes } from "./scenes";

type PopupContent = {
  title: string;
  body: string;
};

type GalleryOverlay = {
  imageSrcs: string[];
  index: number;
};

type TransitionPhase = "idle" | "playing" | "revealing";

type ClickCounts = {
  door: number;
  poster: number;
  bluerosePoster: number;
  decreePoster: number;
  strayPoster: number;
  meteorPoster: number;
  posterLineup: number;
  brochure: number;
  clubRules: number;
  memberCard: number;
  breachedAttempt: number;
  knock: number;
  card: number;
  clubVisited: number;
  bPicture: number;
  bHostProfile: number;
  bPhotos: number;
  bRingBell: number;
  dPicture: number;
  dHostProfile: number;
  dPhotos: number;
  dRingBell: number;
  sPicture: number;
  sHostProfile: number;
  sPhotos: number;
  sRingBell: number;
  mPicture: number;
  mHostProfile: number;
  mPhotos: number;
  mRingBell: number;
  bWing: number;
  dWing: number;
  sWing: number;
  mWing: number;
};

type EventName =
  | "club_visited"
  | "door_clicked"
  | "poster_clicked"
  | "lineup_bluerose_clicked"
  | "lineup_decree_clicked"
  | "lineup_stray_clicked"
  | "lineup_meteor_clicked"
  | "poster_lineup_clicked"
  | "brochure_clicked"
  | "club_rules_clicked"
  | "member_card_clicked"
  | "breached_attempt_clicked"
  | "door_knocked"
  | "card_clicked"
  | "b_picture_clicked"
  | "b_host_profile_clicked"
  | "b_photos_clicked"
  | "b_ring_bell_clicked"
  | "d_picture_clicked"
  | "d_host_profile_clicked"
  | "d_photos_clicked"
  | "d_ring_bell_clicked"
  | "s_picture_clicked"
  | "s_host_profile_clicked"
  | "s_photos_clicked"
  | "s_ring_bell_clicked"
  | "m_picture_clicked"
  | "m_host_profile_clicked"
  | "m_photos_clicked"
  | "m_ring_bell_clicked"
  | "b_wing_clicked"
  | "d_wing_clicked"
  | "s_wing_clicked"
  | "m_wing_clicked";

const SESSION_ID_KEY = "red-contract-session-id";
const LANGUAGE_KEY = "red-contract-language";

const getStoredLanguage = (): Language | null => {
  const storedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
  if (storedLanguage === "en" || storedLanguage === "th") {
    return storedLanguage;
  }

  return null;
};

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
  bluerosePoster: counts?.lineup_bluerose_clicked ?? 0,
  decreePoster: counts?.lineup_decree_clicked ?? 0,
  strayPoster: counts?.lineup_stray_clicked ?? 0,
  meteorPoster: counts?.lineup_meteor_clicked ?? 0,
  posterLineup: counts?.poster_lineup_clicked ?? 0,
  brochure: counts?.brochure_clicked ?? 0,
  clubRules: counts?.club_rules_clicked ?? 0,
  memberCard: counts?.member_card_clicked ?? 0,
  breachedAttempt: counts?.breached_attempt_clicked ?? 0,
  knock: counts?.door_knocked ?? 0,
  card: counts?.card_clicked ?? 0,
  clubVisited: counts?.club_visited ?? 0,
  bPicture: counts?.b_picture_clicked ?? 0,
  bHostProfile: counts?.b_host_profile_clicked ?? 0,
  bPhotos: counts?.b_photos_clicked ?? 0,
  bRingBell: counts?.b_ring_bell_clicked ?? 0,
  dPicture: counts?.d_picture_clicked ?? 0,
  dHostProfile: counts?.d_host_profile_clicked ?? 0,
  dPhotos: counts?.d_photos_clicked ?? 0,
  dRingBell: counts?.d_ring_bell_clicked ?? 0,
  sPicture: counts?.s_picture_clicked ?? 0,
  sHostProfile: counts?.s_host_profile_clicked ?? 0,
  sPhotos: counts?.s_photos_clicked ?? 0,
  sRingBell: counts?.s_ring_bell_clicked ?? 0,
  mPicture: counts?.m_picture_clicked ?? 0,
  mHostProfile: counts?.m_host_profile_clicked ?? 0,
  mPhotos: counts?.m_photos_clicked ?? 0,
  mRingBell: counts?.m_ring_bell_clicked ?? 0,
  bWing: counts?.b_wing_clicked ?? 0,
  dWing: counts?.d_wing_clicked ?? 0,
  sWing: counts?.s_wing_clicked ?? 0,
  mWing: counts?.m_wing_clicked ?? 0,
});

const previousSceneBySceneId: Partial<Record<SceneId, SceneId>> = {
  door: "atrium",
  archive: "door",
  lineup: "archive",
  inside: "archive",
  "B-room": "inside",
  "B-desk": "B-room",
  "B-sofa": "B-room",
  "D-room": "inside",
  "D-desk": "D-room",
  "D-sofa": "D-room",
  "S-room": "inside",
  "S-desk": "S-room",
  "S-sofa": "S-room",
  "M-room": "inside",
  "M-desk": "M-room",
  "M-sofa": "M-room",
};

const scenePathBySceneId: Partial<Record<SceneId, string>> = {
  "B-room": "/B-room",
  "B-desk": "/B-room",
  "B-sofa": "/B-room",
  "D-room": "/D-room",
  "D-desk": "/D-room",
  "D-sofa": "/D-room",
  "S-room": "/S-room",
  "S-desk": "/S-room",
  "S-sofa": "/S-room",
  "M-room": "/M-room",
  "M-desk": "/M-room",
  "M-sofa": "/M-room",
};

const getInitialSceneId = (): SceneId => {
  if (window.location.pathname === "/B-room") {
    return "B-room";
  }
  if (window.location.pathname === "/D-room") {
    return "D-room";
  }
  if (window.location.pathname === "/S-room") {
    return "S-room";
  }
  if (window.location.pathname === "/M-room") {
    return "M-room";
  }

  return "atrium";
};

const updateScenePath = (nextSceneId: SceneId) => {
  const nextPath = scenePathBySceneId[nextSceneId] ?? "/";
  if (window.location.pathname !== nextPath) {
    window.history.pushState({}, "", nextPath);
  }
};

const randomBreachedAttemptAudio = [
  "/assets/ran1.mp3",
  "/assets/ran2.mp3",
  "/assets/ran3.mp3",
  "/assets/ran4.mp3",
  "/assets/ran5.mp3",
];

const getNextRandomBreachedAttemptMilestone = (from: number) => from + 10 + Math.floor(Math.random() * 61);

const backgroundMusicFullVolume = 1;
const backgroundMusicDuckedVolume = 0.3;
const backgroundMusicDuckEvent = "red-contract-background-music-duck";

const setBackgroundMusicDucked = (isDucked: boolean) => {
  window.dispatchEvent(new CustomEvent(backgroundMusicDuckEvent, { detail: { isDucked } }));
};

const getWingEventName = (hotspotId: string): EventName | null => {
  if (hotspotId === "inside-door-left") {
    return "b_wing_clicked";
  }
  if (hotspotId === "inside-door-center-left") {
    return "d_wing_clicked";
  }
  if (hotspotId === "inside-door-center-right") {
    return "s_wing_clicked";
  }
  if (hotspotId === "inside-door-right") {
    return "m_wing_clicked";
  }
  return null;
};

function App() {
  if (window.location.pathname === "/b-mini-game") {
    return <BotClickTest variant="b" />;
  }

  if (window.location.pathname === "/m-mini-game") {
    return <BotClickTest variant="m" />;
  }

  if (window.location.pathname === "/s-mini-game") {
    return <BotClickTest variant="s" />;
  }

  if (window.location.pathname === "/d-mini-game" || window.location.pathname === "/bot-test") {
    return <BotClickTest variant="d" />;
  }

  const initialLanguage = getStoredLanguage();
  const [sceneId, setSceneId] = useState<SceneId>(getInitialSceneId);
  const [popup, setPopup] = useState<PopupContent | null>(null);
  const [imageOverlaySrc, setImageOverlaySrc] = useState<string | null>(null);
  const [galleryOverlay, setGalleryOverlay] = useState<GalleryOverlay | null>(null);
  const [selectedLanguage] = useState<Language>(initialLanguage ?? "en");
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>("idle");
  const [transitionTargetSceneId, setTransitionTargetSceneId] = useState<SceneId>("archive");
  const [transitionVideoSrc, setTransitionVideoSrc] = useState("/assets/transition1.mp4");
  const [scenePlaybackKey, setScenePlaybackKey] = useState(0);
  const [isHotspotAudioPlaying, setIsHotspotAudioPlaying] = useState(false);
  const [isOverlayAudioSequencePlaying, setIsOverlayAudioSequencePlaying] = useState(false);
  const [subtitleText, setSubtitleText] = useState<string | null>(null);
  const [breachedAttempts, setBreachedAttempts] = useState(0);
  const [scenePan, setScenePan] = useState({ x: 0, y: 0 });
  const [isDraggingScene, setIsDraggingScene] = useState(false);
  const dragStartRef = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number; moved: boolean } | null>(
    null,
  );
  const gallerySwipeStartRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const nextRandomBreachedAttemptRef = useRef<number | null>(null);
  const visitTrackedRef = useRef(false);
  const [clickCounts, setClickCounts] = useState<ClickCounts>({
    door: 0,
    poster: 0,
    bluerosePoster: 0,
    decreePoster: 0,
    strayPoster: 0,
    meteorPoster: 0,
    posterLineup: 0,
    brochure: 0,
    clubRules: 0,
    memberCard: 0,
    breachedAttempt: 0,
    knock: 0,
    card: 0,
    clubVisited: 0,
    bPicture: 0,
    bHostProfile: 0,
    bPhotos: 0,
    bRingBell: 0,
    dPicture: 0,
    dHostProfile: 0,
    dPhotos: 0,
    dRingBell: 0,
    sPicture: 0,
    sHostProfile: 0,
    sPhotos: 0,
    sRingBell: 0,
    mPicture: 0,
    mHostProfile: 0,
    mPhotos: 0,
    mRingBell: 0,
    bWing: 0,
    dWing: 0,
    sWing: 0,
    mWing: 0,
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
      if (eventName === "lineup_bluerose_clicked") {
        return { ...current, bluerosePoster: current.bluerosePoster + 1 };
      }
      if (eventName === "lineup_decree_clicked") {
        return { ...current, decreePoster: current.decreePoster + 1 };
      }
      if (eventName === "lineup_stray_clicked") {
        return { ...current, strayPoster: current.strayPoster + 1 };
      }
      if (eventName === "lineup_meteor_clicked") {
        return { ...current, meteorPoster: current.meteorPoster + 1 };
      }
      if (eventName === "poster_lineup_clicked") {
        return { ...current, posterLineup: current.posterLineup + 1 };
      }
      if (eventName === "brochure_clicked") {
        return { ...current, brochure: current.brochure + 1 };
      }
      if (eventName === "club_rules_clicked") {
        return { ...current, clubRules: current.clubRules + 1 };
      }
      if (eventName === "member_card_clicked") {
        return { ...current, memberCard: current.memberCard + 1 };
      }
      if (eventName === "breached_attempt_clicked") {
        return { ...current, breachedAttempt: current.breachedAttempt + 1 };
      }
      if (eventName === "door_knocked") {
        return { ...current, knock: current.knock + 1 };
      }
      if (eventName === "b_picture_clicked") {
        return { ...current, bPicture: current.bPicture + 1 };
      }
      if (eventName === "b_host_profile_clicked") {
        return { ...current, bHostProfile: current.bHostProfile + 1 };
      }
      if (eventName === "b_photos_clicked") {
        return { ...current, bPhotos: current.bPhotos + 1 };
      }
      if (eventName === "b_ring_bell_clicked") {
        return { ...current, bRingBell: current.bRingBell + 1 };
      }
      if (eventName === "d_picture_clicked") {
        return { ...current, dPicture: current.dPicture + 1 };
      }
      if (eventName === "d_host_profile_clicked") {
        return { ...current, dHostProfile: current.dHostProfile + 1 };
      }
      if (eventName === "d_photos_clicked") {
        return { ...current, dPhotos: current.dPhotos + 1 };
      }
      if (eventName === "d_ring_bell_clicked") {
        return { ...current, dRingBell: current.dRingBell + 1 };
      }
      if (eventName === "s_picture_clicked") {
        return { ...current, sPicture: current.sPicture + 1 };
      }
      if (eventName === "s_host_profile_clicked") {
        return { ...current, sHostProfile: current.sHostProfile + 1 };
      }
      if (eventName === "s_photos_clicked") {
        return { ...current, sPhotos: current.sPhotos + 1 };
      }
      if (eventName === "s_ring_bell_clicked") {
        return { ...current, sRingBell: current.sRingBell + 1 };
      }
      if (eventName === "m_picture_clicked") {
        return { ...current, mPicture: current.mPicture + 1 };
      }
      if (eventName === "m_host_profile_clicked") {
        return { ...current, mHostProfile: current.mHostProfile + 1 };
      }
      if (eventName === "m_photos_clicked") {
        return { ...current, mPhotos: current.mPhotos + 1 };
      }
      if (eventName === "m_ring_bell_clicked") {
        return { ...current, mRingBell: current.mRingBell + 1 };
      }
      if (eventName === "b_wing_clicked") {
        return { ...current, bWing: current.bWing + 1 };
      }
      if (eventName === "d_wing_clicked") {
        return { ...current, dWing: current.dWing + 1 };
      }
      if (eventName === "s_wing_clicked") {
        return { ...current, sWing: current.sWing + 1 };
      }
      if (eventName === "m_wing_clicked") {
        return { ...current, mWing: current.mWing + 1 };
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
    const wingEventName = getWingEventName(hotspotId);
    if (wingEventName) {
      void trackEvent(wingEventName);
    }

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
      if (hotspotId === "lineup-bluerose") {
        void trackEvent("lineup_bluerose_clicked");
      }
      if (hotspotId === "lineup-decree") {
        void trackEvent("lineup_decree_clicked");
      }
      if (hotspotId === "lineup-stray") {
        void trackEvent("lineup_stray_clicked");
      }
      if (hotspotId === "lineup-meteor") {
        void trackEvent("lineup_meteor_clicked");
      }
      if (hotspotId === "b-wall-image") {
        void trackEvent("b_picture_clicked");
      }
      if (hotspotId === "d-wall-image") {
        void trackEvent("d_picture_clicked");
      }
      if (hotspotId === "s-wall-image") {
        void trackEvent("s_picture_clicked");
      }
      if (hotspotId === "m-wall-image") {
        void trackEvent("m_picture_clicked");
      }
      if (action.audioSrc) {
        void new Audio(action.audioSrc).play();
      }
      setImageOverlaySrc(action.localizedImageSrcs?.[selectedLanguage] ?? action.imageSrc);
      return;
    }

    if (action.type === "gallery") {
      if (dragStartRef.current?.moved) {
        return;
      }
      if (hotspotId === "club-rules") {
        void trackEvent("club_rules_clicked");
      }
      if (action.audioSrc) {
        void new Audio(action.audioSrc).play();
      }
      setGalleryOverlay({ imageSrcs: action.localizedImageSrcs?.[selectedLanguage] ?? action.imageSrcs, index: 0 });
      return;
    }

    if (action.type === "audio") {
      if (dragStartRef.current?.moved) {
        return;
      }
      if (isHotspotAudioPlaying) {
        return;
      }

      if (hotspotId === "door-outside-handle") {
        void trackEvent("door_knocked");
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

    if (sceneId === "archive" && action.target === "inside") {
      void new Audio("/assets/whoosp.mp3").play();
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("inside");
      setTransitionVideoSrc("/assets/transition3.mp4");
      setTransitionPhase("playing");
      return;
    }

    if (sceneId === "inside" && action.target === "B-room") {
      void new Audio("/assets/door-open.mp3").play();
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("B-room");
      setTransitionVideoSrc("");
      setTransitionPhase("playing");
      return;
    }

    if (sceneId === "inside" && action.target === "D-room") {
      void new Audio("/assets/door-open.mp3").play();
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("D-room");
      setTransitionVideoSrc("");
      setTransitionPhase("playing");
      return;
    }

    if (sceneId === "inside" && action.target === "S-room") {
      void new Audio("/assets/door-open.mp3").play();
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("S-room");
      setTransitionVideoSrc("");
      setTransitionPhase("playing");
      return;
    }

    if (sceneId === "inside" && action.target === "M-room") {
      void new Audio("/assets/door-open.mp3").play();
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("M-room");
      setTransitionVideoSrc("");
      setTransitionPhase("playing");
      return;
    }

    setSceneId(action.target);
    updateScenePath(action.target);
  };

  const getPosterClickCount = (hotspotId: string) => {
    if (hotspotId === "lineup-bluerose") {
      return clickCounts.bluerosePoster;
    }
    if (hotspotId === "lineup-decree") {
      return clickCounts.decreePoster;
    }
    if (hotspotId === "lineup-stray") {
      return clickCounts.strayPoster;
    }
    if (hotspotId === "lineup-meteor") {
      return clickCounts.meteorPoster;
    }
    return null;
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
          disabled={isTransitioning || (hotspot.action?.type === "audio" && isHotspotAudioPlaying)}
          aria-label={hotspot.label}
          onClick={(event) => {
            const wingEventName = getWingEventName(hotspot.id);
            if (wingEventName && !hotspot.action) {
              event.stopPropagation();
              void trackEvent(wingEventName);
              return;
            }
            if (hotspot.action) {
              event.stopPropagation();
              handleHotspot(hotspot.id, hotspot.action);
            }
          }}
        >
          {hotspot.id.startsWith("lineup-") ? (
            <span className="lineup-poster-counter">Poster Clicked: {getPosterClickCount(hotspot.id)}</span>
          ) : null}
          {hotspot.id === "lobby-up-button" ? <ArrowUp size={24} aria-hidden="true" /> : null}
          {hotspot.imageSrc ? <img src={hotspot.imageSrc} alt="" aria-hidden="true" draggable={false} /> : null}
          <span>{hotspot.label}</span>
        </button>
      )),
    [clickCounts, displayedScene.hotspots, isHotspotAudioPlaying, isTransitioning, sceneId, selectedLanguage],
  );

  const handleSceneOverlay = (overlay: SceneOverlay) => {
    if (!overlay.action || dragStartRef.current?.moved || isTransitioning) {
      return;
    }

    if (overlay.id === "board") {
      void trackEvent("poster_lineup_clicked");
    }
    if (overlay.id === "room-explaining") {
      void trackEvent("brochure_clicked");
    }
    if (overlay.id === "board2") {
      void trackEvent("member_card_clicked");
    }
    if (overlay.id === "b-item-1") {
      void trackEvent("b_ring_bell_clicked");
    }
    if (overlay.id === "b-item-2") {
      void trackEvent("b_host_profile_clicked");
    }
    if (overlay.id === "b-item-4") {
      void trackEvent("b_photos_clicked");
    }
    if (overlay.id === "d-item-1") {
      void trackEvent("d_host_profile_clicked");
    }
    if (overlay.id === "d-item-2") {
      void trackEvent("d_ring_bell_clicked");
    }
    if (overlay.id === "d-item-3") {
      void trackEvent("d_photos_clicked");
    }
    if (overlay.id === "s-item-1") {
      void trackEvent("s_host_profile_clicked");
    }
    if (overlay.id === "s-item-2") {
      void trackEvent("s_ring_bell_clicked");
    }
    if (overlay.id === "s-item-3") {
      void trackEvent("s_photos_clicked");
    }
    if (overlay.id === "m-item-1") {
      void trackEvent("m_host_profile_clicked");
    }
    if (overlay.id === "m-item-2") {
      void trackEvent("m_ring_bell_clicked");
    }
    if (overlay.id === "m-item-3") {
      void trackEvent("m_photos_clicked");
    }

    if ("audioSrc" in overlay.action && overlay.action.audioSrc) {
      void new Audio(overlay.action.audioSrc).play();
    }

    if (overlay.action.type === "audio-sequence") {
      if (isOverlayAudioSequencePlaying) {
        return;
      }

      const [firstAudioSrc, ...remainingAudioSrcs] = overlay.action.audioSrcs;
      if (!firstAudioSrc) {
        return;
      }

      setIsOverlayAudioSequencePlaying(true);
      setSubtitleText(overlay.action.subtitleText ?? null);
      setBackgroundMusicDucked(true);

      const playAudioSequence = (audioSrcs: string[]) => {
        const [audioSrc, ...nextAudioSrcs] = audioSrcs;
        if (!audioSrc) {
          setIsOverlayAudioSequencePlaying(false);
          setSubtitleText(null);
          setBackgroundMusicDucked(false);
          return;
        }

        const audio = new Audio(audioSrc);
        audio.addEventListener(
          "ended",
          () => {
            playAudioSequence(nextAudioSrcs);
          },
          { once: true },
        );
        void audio.play().catch(() => {
          playAudioSequence(nextAudioSrcs);
        });
      };

      playAudioSequence([firstAudioSrc, ...remainingAudioSrcs]);
      return;
    }

    if (overlay.action.type === "gallery") {
      setGalleryOverlay({
        imageSrcs: overlay.action.localizedImageSrcs?.[selectedLanguage] ?? overlay.action.imageSrcs,
        index: 0,
      });
      return;
    }

    if (overlay.action.type === "image") {
      setImageOverlaySrc(overlay.action.localizedImageSrcs?.[selectedLanguage] ?? overlay.action.imageSrc);
      return;
    }

    if (displayedScene.id === "B-room" && overlay.action.target === "B-desk") {
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("B-desk");
      setTransitionVideoSrc("/assets/transition4.mp4");
      setTransitionPhase("playing");
      return;
    }

    if (displayedScene.id === "B-room" && overlay.action.target === "B-sofa") {
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("B-sofa");
      setTransitionVideoSrc("/assets/transition5.mp4");
      setTransitionPhase("playing");
      return;
    }

    if (displayedScene.id === "D-room" && overlay.action.target === "D-desk") {
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("D-desk");
      setTransitionVideoSrc("/assets/transition7.mp4");
      setTransitionPhase("playing");
      return;
    }

    if (displayedScene.id === "D-room" && overlay.action.target === "D-sofa") {
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("D-sofa");
      setTransitionVideoSrc("/assets/transition8.mp4");
      setTransitionPhase("playing");
      return;
    }

    if (displayedScene.id === "S-room" && overlay.action.target === "S-desk") {
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("S-desk");
      setTransitionVideoSrc("/assets/transition9.mp4");
      setTransitionPhase("playing");
      return;
    }

    if (displayedScene.id === "S-room" && overlay.action.target === "S-sofa") {
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("S-sofa");
      setTransitionVideoSrc("/assets/transition10.mp4");
      setTransitionPhase("playing");
      return;
    }

    if (displayedScene.id === "M-room" && overlay.action.target === "M-desk") {
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("M-desk");
      setTransitionVideoSrc("/assets/transition11.mp4");
      setTransitionPhase("playing");
      return;
    }

    if (displayedScene.id === "M-room" && overlay.action.target === "M-sofa") {
      setScenePan({ x: 0, y: 0 });
      setTransitionTargetSceneId("M-sofa");
      setTransitionVideoSrc("/assets/transition12.mp4");
      setTransitionPhase("playing");
      return;
    }

    setScenePan({ x: 0, y: 0 });
    setSceneId(overlay.action.target);
    setScenePlaybackKey((current) => current + 1);
    updateScenePath(overlay.action.target);
  };

  const moveGallery = (direction: -1 | 1) => {
    void new Audio("/assets/flip.mp3").play();
    setGalleryOverlay((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        index: (current.index + direction + current.imageSrcs.length) % current.imageSrcs.length,
      };
    });
  };

  const handleGalleryPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    gallerySwipeStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleGalleryPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const swipeStart = gallerySwipeStartRef.current;
    if (!swipeStart || swipeStart.pointerId !== event.pointerId) {
      return;
    }

    gallerySwipeStartRef.current = null;
    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) {
      return;
    }

    moveGallery(deltaX < 0 ? 1 : -1);
  };

  const sceneOverlays = useMemo(
    () =>
      displayedScene.overlays?.map((overlay) => (
        <button
          className={`scene-overlay-hotspot${overlay.hitbox ? " scene-overlay-hotspot-custom-hitbox" : ""}`}
          data-clickable={overlay.action ? "true" : "false"}
          data-overlay-id={overlay.id}
          key={overlay.id}
          style={{
            left: `${overlay.x}%`,
            top: `${overlay.y}%`,
            width: `${overlay.width}%`,
            "--overlay-hitbox-left": overlay.hitbox ? `${overlay.hitbox.x}%` : undefined,
            "--overlay-hitbox-top": overlay.hitbox ? `${overlay.hitbox.y}%` : undefined,
            "--overlay-hitbox-width": overlay.hitbox ? `${overlay.hitbox.width}%` : undefined,
            "--overlay-hitbox-height": overlay.hitbox ? `${overlay.hitbox.height}%` : undefined,
          } as CSSProperties}
          type="button"
          disabled={overlay.action?.type === "audio-sequence" && isOverlayAudioSequencePlaying}
          aria-label={overlay.label}
          onClick={() => handleSceneOverlay(overlay)}
        >
          <img src={overlay.src} alt="" aria-hidden="true" draggable={false} />
        </button>
      )) ?? [],
    [displayedScene.overlays, isOverlayAudioSequencePlaying, isTransitioning, selectedLanguage],
  );

  const finishTransition = () => {
    setTransitionPhase("revealing");
  };

  const completeReveal = () => {
    setSceneId(transitionTargetSceneId);
    setScenePlaybackKey((current) => current + 1);
    setTransitionPhase("idle");
    updateScenePath(transitionTargetSceneId);
  };

  const handleScenePointerDown = (event: PointerEvent<HTMLElement>) => {
    const target = event.target;
    if (
      isTransitioning ||
      imageOverlaySrc ||
      galleryOverlay ||
      !canDragScene() ||
      (target instanceof Element && target.closest(".icon-button, .language-toggle, .close-button"))
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

  const handleBack = () => {
    const previousSceneId = previousSceneBySceneId[sceneId] ?? "atrium";
    setTransitionPhase("idle");
    setScenePan({ x: 0, y: 0 });
    setSceneId(previousSceneId);
    setScenePlaybackKey((current) => current + 1);
    setTransitionTargetSceneId("archive");
    updateScenePath(previousSceneId);
  };

  const handleSceneClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target;
    if (
      sceneId !== "inside" ||
      isTransitioning ||
      imageOverlaySrc ||
      galleryOverlay ||
      (target instanceof Element && target.closest(".icon-button, .language-toggle, .close-button, .gallery-arrow"))
    ) {
      return;
    }

    void trackEvent("breached_attempt_clicked");
    void new Audio("/assets/chain.mp3").play();

    setBreachedAttempts((current) => {
      const next = current + 1;
      let audioSrc: string | null = null;

      if (next === 10) {
        audioSrc = "/assets/10.mp3";
      } else if (next === 50) {
        audioSrc = "/assets/50.mp3";
      } else if (next === 100) {
        audioSrc = "/assets/100.mp3";
        nextRandomBreachedAttemptRef.current = getNextRandomBreachedAttemptMilestone(next);
      } else if (next > 100 && nextRandomBreachedAttemptRef.current === null) {
        nextRandomBreachedAttemptRef.current = getNextRandomBreachedAttemptMilestone(next);
      } else if (nextRandomBreachedAttemptRef.current === next) {
        audioSrc = randomBreachedAttemptAudio[Math.floor(Math.random() * randomBreachedAttemptAudio.length)];
        nextRandomBreachedAttemptRef.current = getNextRandomBreachedAttemptMilestone(next);
      }

      if (audioSrc) {
        void new Audio(audioSrc).play();
      }

      return next;
    });
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
        onClick={handleSceneClick}
        aria-label={displayedScene.name || "Atrium"}
      >
        <VideoScene
          sceneId={displayedScene.id}
          playbackKey={scenePlaybackKey}
          shouldPlay={!isTransitioning}
          src={displayedScene.videoSrc}
          posterSrc={displayedScene.posterSrc}
          loop={displayedScene.loop ?? true}
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
              aria-label="Back"
              onClick={handleBack}
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          ) : (
            <span className="top-bar-spacer" />
          )}
          <ClickCounter sceneId={displayedScene.id} counts={clickCounts} />
          <div className="top-controls">
            <SoundButton audioSrc={getSceneAudioSrc(sceneId)} />
            <LanguageButton selectedLanguage={selectedLanguage} />
          </div>
        </div>

        {subtitleText ? <div className="scene-subtitle">{subtitleText}</div> : null}

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

      {galleryOverlay ? (
        <div
          className="image-backdrop gallery-backdrop"
          role="presentation"
          onClick={() => setGalleryOverlay(null)}
          onPointerDown={handleGalleryPointerDown}
          onPointerUp={handleGalleryPointerUp}
          onPointerCancel={() => {
            gallerySwipeStartRef.current = null;
          }}
        >
          <button
            className="gallery-arrow gallery-arrow-left"
            type="button"
            aria-label="Previous room image"
            onClick={(event) => {
              event.stopPropagation();
              moveGallery(-1);
            }}
          >
            <ChevronLeft size={28} aria-hidden="true" />
          </button>
          <img
            className="image-overlay gallery-image"
            src={galleryOverlay.imageSrcs[galleryOverlay.index]}
            alt=""
            onClick={(event) => event.stopPropagation()}
            draggable={false}
          />
          <button
            className="gallery-arrow gallery-arrow-right"
            type="button"
            aria-label="Next room image"
            onClick={(event) => {
              event.stopPropagation();
              moveGallery(1);
            }}
          >
            <ChevronRight size={28} aria-hidden="true" />
          </button>
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

  if (sceneId === "archive") {
    return (
      <div className="click-counter lobby-counter" aria-live="polite">
        <span>Poster Lineup Clicked: {counts.posterLineup}</span>
        <span>Brochure Clicked: {counts.brochure}</span>
        <span>Club Rules Clicked: {counts.clubRules}</span>
        <span>Member Card Clicked: {counts.memberCard}</span>
      </div>
    );
  }

  if (sceneId === "inside") {
    return (
      <div className="click-counter lobby-counter" aria-live="polite">
        <span>Breach Successful: {counts.breachedAttempt}</span>
        <span>B Wing: {counts.bWing}</span>
        <span>D Wing: {counts.dWing}</span>
        <span>S Wing: {counts.sWing}</span>
        <span>M Wing: {counts.mWing}</span>
      </div>
    );
  }

  if (sceneId === "B-room" || sceneId === "B-desk" || sceneId === "B-sofa") {
    return (
      <div className="click-counter lobby-counter" aria-live="polite">
        <span>Picture Clicked: {counts.bPicture}</span>
        <span>Host Profile Clicked: {counts.bHostProfile}</span>
        <span>Photos Clicked: {counts.bPhotos}</span>
        <span>Ring Bell: {counts.bRingBell}</span>
      </div>
    );
  }

  if (sceneId === "D-room" || sceneId === "D-desk" || sceneId === "D-sofa") {
    return (
      <div className="click-counter lobby-counter" aria-live="polite">
        <span>Picture Clicked: {counts.dPicture}</span>
        <span>Host Profile Clicked: {counts.dHostProfile}</span>
        <span>Photos Clicked: {counts.dPhotos}</span>
        <span>Ring Bell: {counts.dRingBell}</span>
      </div>
    );
  }

  if (sceneId === "S-room" || sceneId === "S-desk" || sceneId === "S-sofa") {
    return (
      <div className="click-counter lobby-counter" aria-live="polite">
        <span>Picture Clicked: {counts.sPicture}</span>
        <span>Host Profile Clicked: {counts.sHostProfile}</span>
        <span>Photos Clicked: {counts.sPhotos}</span>
        <span>Ring Bell: {counts.sRingBell}</span>
      </div>
    );
  }

  if (sceneId === "M-room" || sceneId === "M-desk" || sceneId === "M-sofa") {
    return (
      <div className="click-counter lobby-counter" aria-live="polite">
        <span>Picture Clicked: {counts.mPicture}</span>
        <span>Host Profile Clicked: {counts.mHostProfile}</span>
        <span>Photos Clicked: {counts.mPhotos}</span>
        <span>Ring Bell: {counts.mRingBell}</span>
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
    if (src || phase !== "playing") {
      return;
    }

    const blackScreenTimer = window.setTimeout(onFinish, 650);
    return () => window.clearTimeout(blackScreenTimer);
  }, [onFinish, phase, src]);

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
      {src && !videoFailed ? (
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

type SoundButtonProps = {
  audioSrc: string;
};

const getSceneAudioSrc = (sceneId: SceneId) =>
  sceneId === "B-room" || sceneId === "B-desk" || sceneId === "B-sofa"
    ? "/assets/Rosen B.mp3"
    : sceneId === "D-room" || sceneId === "D-desk" || sceneId === "D-sofa"
      ? "/assets/Michael D.mp3"
      : sceneId === "S-room" || sceneId === "S-desk" || sceneId === "S-sofa"
        ? "/assets/Ryusei S.mp3"
        : sceneId === "M-room" || sceneId === "M-desk" || sceneId === "M-sofa"
          ? "/assets/Noel M.mp3"
          : "/assets/sound.mp3";

function SoundButton({ audioSrc }: SoundButtonProps) {
  const [isSoundOn, setIsSoundOn] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSrcRef = useRef<string | null>(null);
  const isSoundOnRef = useRef(isSoundOn);
  const isDuckedRef = useRef(false);

  useEffect(() => {
    isSoundOnRef.current = isSoundOn;
  }, [isSoundOn]);

  useEffect(() => {
    if (audioRef.current && audioSrcRef.current === audioSrc) {
      return;
    }

    audioRef.current?.pause();

    const audio = new Audio(audioSrc);
    audio.loop = true;
    audio.volume = isDuckedRef.current ? backgroundMusicDuckedVolume : backgroundMusicFullVolume;
    audioRef.current = audio;
    audioSrcRef.current = audioSrc;

    if (isSoundOnRef.current) {
      void audio.play().catch(() => {
        // Browsers can block unmuted autoplay until the first user gesture.
        setIsSoundOn(false);
      });
    }

    return () => {
      audio.pause();
      if (audioRef.current === audio) {
        audioRef.current = null;
        audioSrcRef.current = null;
      }
    };
  }, [audioSrc]);

  useEffect(() => {
    const handleMusicDuck = (event: Event) => {
      const isDucked =
        event instanceof CustomEvent &&
        typeof event.detail === "object" &&
        event.detail !== null &&
        "isDucked" in event.detail &&
        event.detail.isDucked === true;
      isDuckedRef.current = isDucked;
      if (audioRef.current) {
        audioRef.current.volume = isDucked ? backgroundMusicDuckedVolume : backgroundMusicFullVolume;
      }
    };

    window.addEventListener(backgroundMusicDuckEvent, handleMusicDuck);
    return () => window.removeEventListener(backgroundMusicDuckEvent, handleMusicDuck);
  }, []);

  const toggleSound = () => {
    const audio = audioRef.current ?? new Audio(audioSrc);
    audio.loop = true;
    audio.volume = isDuckedRef.current ? backgroundMusicDuckedVolume : backgroundMusicFullVolume;
    audioRef.current = audio;
    audioSrcRef.current = audioSrc;

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

type LanguageButtonProps = {
  selectedLanguage: Language;
};

function LanguageButton({ selectedLanguage }: LanguageButtonProps) {
  const nextLanguage: Language = selectedLanguage === "en" ? "th" : "en";
  const nextLanguageLabel = nextLanguage === "en" ? "English" : "ไทย";

  const switchLanguage = () => {
    window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
    window.location.href = "/";
  };

  return (
    <button
      className="language-toggle"
      type="button"
      aria-label={`Switch language to ${nextLanguageLabel}`}
      title={`Switch language to ${nextLanguageLabel}`}
      onClick={switchLanguage}
    >
      <img
        src={selectedLanguage === "en" ? "/assets/en.png" : "/assets/th.png"}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    </button>
  );
}

type VideoSceneProps = {
  sceneId: SceneId;
  playbackKey: number;
  shouldPlay: boolean;
  src: string;
  posterSrc?: string;
  loop: boolean;
  fallbackClassName: string;
};

function VideoScene({ sceneId, playbackKey, shouldPlay, src, posterSrc, loop, fallbackClassName }: VideoSceneProps) {
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
      {src && !videoFailed ? (
        <video
          key={`${sceneId}-${playbackKey}`}
          className={`scene-video${videoReady ? " scene-video-ready" : ""}`}
          src={src}
          autoPlay={shouldPlay}
          muted
          loop={loop}
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
