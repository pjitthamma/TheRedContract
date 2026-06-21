export type SceneId = "atrium" | "door" | "archive" | "lineup" | "inside";

export type HotspotAction =
  | {
      type: "popup";
      title: string;
      body: string;
    }
  | {
      type: "scene";
      target: SceneId;
    }
  | {
      type: "audio";
      src: string;
    }
  | {
      type: "image";
      imageSrc: string;
      audioSrc?: string;
    }
  | {
      type: "gallery";
      imageSrcs: string[];
      audioSrc?: string;
    };

export type Hotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  action?: HotspotAction;
};

export type SceneOverlay = {
  id: string;
  label: string;
  src: string;
  x: number;
  y: number;
  width: number;
  action?: {
    type: "scene";
    target: SceneId;
    audioSrc?: string;
  } | {
    type: "image";
    imageSrc: string;
    audioSrc?: string;
  } | {
    type: "gallery";
    imageSrcs: string[];
    audioSrc?: string;
  };
};

export type Scene = {
  id: SceneId;
  name: string;
  videoSrc: string;
  posterSrc?: string;
  loop?: boolean;
  aspectRatio: number;
  fallbackClassName: string;
  overlays?: SceneOverlay[];
  hotspots: Hotspot[];
};

export const scenes: Record<SceneId, Scene> = {
  atrium: {
    id: "atrium",
    name: "",
    videoSrc: "/assets/landing-page.mp4",
    posterSrc: "/assets/outside.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-atrium",
    hotspots: [
      {
        id: "archive-door",
        label: "Front door",
        x: 37.3,
        y: 23.8,
        width: 25.1,
        height: 54.6,
        action: {
          type: "scene",
          target: "door",
        },
      },
      {
        id: "atrium-poster",
        label: "Wall poster",
        x: 75.4,
        y: 25.8,
        width: 10,
        height: 25.7,
        action: {
          type: "image",
          imageSrc: "/assets/poster.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
  },
  door: {
    id: "door",
    name: "",
    videoSrc: "/assets/door_open.mp4",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-door",
    hotspots: [
      {
        id: "door-outside-handle",
        label: "Outside door handle area",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        action: {
          type: "audio",
          src: "/assets/door-knock.mp3",
        },
      },
      {
        id: "door-handle",
        label: "Door handle",
        x: 39.4,
        y: 12.8,
        width: 17.6,
        height: 79.4,
        action: {
          type: "scene",
          target: "archive",
        },
      },
    ],
  },
  archive: {
    id: "archive",
    name: "",
    videoSrc: "/assets/lobby-video.mp4",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-archive",
    overlays: [
      {
        id: "board",
        label: "Board",
        src: "/assets/board.png",
        x: 16.5,
        y: 13.4,
        width: 20.2,
        action: {
          type: "scene",
          target: "lineup",
          audioSrc: "/assets/whoosp.mp3",
        },
      },
      {
        id: "room-explaining",
        label: "Room explaining",
        src: "/assets/room-explaining.png",
        x: 46.8,
        y: 57.2,
        width: 9.6,
        action: {
          type: "gallery",
          audioSrc: "/assets/flip.mp3",
          imageSrcs: [
            "/assets/b-room-en.png",
            "/assets/d-room-en.png",
            "/assets/s-room-en.png",
            "/assets/m-room-en.png",
          ],
        },
      },
      {
        id: "board2",
        label: "Board 2",
        src: "/assets/board2.png",
        x: 80.6,
        y: 41.8,
        width: 12.4,
        action: {
          type: "image",
          imageSrc: "/assets/member_en.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
    hotspots: [
      {
        id: "club-rules",
        label: "Club rules",
        x: 64.5,
        y: 25.6,
        width: 9.3,
        height: 30.5,
        action: {
          type: "gallery",
          imageSrcs: ["/assets/rule_en_1.png", "/assets/rule_en_2.png"],
          audioSrc: "/assets/flip.mp3",
        },
      },
      {
        id: "lobby-up-button",
        label: "Go inside",
        x: 47.1,
        y: 32.2,
        width: 4.8,
        height: 8.6,
        action: {
          type: "scene",
          target: "inside",
        },
      },
    ],
  },
  lineup: {
    id: "lineup",
    name: "",
    videoSrc: "/assets/line-up.mp4",
    posterSrc: "/assets/line-up-all.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-lineup",
    hotspots: [
      {
        id: "lineup-bluerose",
        label: "Bluerose poster",
        x: 13.2,
        y: 33.8,
        width: 18.1,
        height: 49.8,
        action: {
          type: "image",
          imageSrc: "/assets/b_cover.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
      {
        id: "lineup-decree",
        label: "Decree poster",
        x: 32,
        y: 32.8,
        width: 17.2,
        height: 50.8,
        action: {
          type: "image",
          imageSrc: "/assets/d_cover.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
      {
        id: "lineup-stray",
        label: "Stray poster",
        x: 50.2,
        y: 32.8,
        width: 18.2,
        height: 50.8,
        action: {
          type: "image",
          imageSrc: "/assets/s_cover.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
      {
        id: "lineup-meteor",
        label: "Meteor poster",
        x: 68.9,
        y: 32.8,
        width: 18.2,
        height: 50.8,
        action: {
          type: "image",
          imageSrc: "/assets/m_cover.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
  },
  inside: {
    id: "inside",
    name: "",
    videoSrc: "/assets/inside.mp4",
    posterSrc: "/assets/lobby.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-inside",
    hotspots: [],
  },
};
