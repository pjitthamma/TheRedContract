export type SceneId = "atrium" | "archive";

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
    };

export type Hotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  action: HotspotAction;
};

export type Scene = {
  id: SceneId;
  name: string;
  videoSrc: string;
  aspectRatio: number;
  fallbackClassName: string;
  hotspots: Hotspot[];
};

export const scenes: Record<SceneId, Scene> = {
  atrium: {
    id: "atrium",
    name: "",
    videoSrc: "/assets/landing-page.mp4",
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
          target: "archive",
        },
      },
    ],
  },
  archive: {
    id: "archive",
    name: "",
    videoSrc: "/assets/noted.mp4",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-archive",
    hotspots: [
      {
        id: "archive-outside-card",
        label: "Outside card area",
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
        id: "card",
        label: "Card",
        x: 35.6,
        y: 25.1,
        width: 36.4,
        height: 50.5,
        action: {
          type: "audio",
          src: "/assets/master-voice.mp3",
        },
      },
    ],
  },
};
