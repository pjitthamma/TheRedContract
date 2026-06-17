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
  fallbackClassName: string;
  hotspots: Hotspot[];
};

export const scenes: Record<SceneId, Scene> = {
  atrium: {
    id: "atrium",
    name: "Moonlit Atrium",
    videoSrc: "/assets/scene-atrium.mp4",
    fallbackClassName: "fallback-atrium",
    hotspots: [
      {
        id: "glass-case",
        label: "Inspect glass case",
        x: 17,
        y: 48,
        width: 15,
        height: 22,
        action: {
          type: "popup",
          title: "Glass Case",
          body: "The display is locked, but a faint light pulses inside. This is where you can reveal story clues, item descriptions, or puzzle hints.",
        },
      },
      {
        id: "archive-door",
        label: "Front door",
        x: 35.2,
        y: 23.8,
        width: 29.2,
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
    name: "Quiet Archive",
    videoSrc: "/assets/scene-archive.mp4",
    fallbackClassName: "fallback-archive",
    hotspots: [
      {
        id: "desk-note",
        label: "Read note",
        x: 39,
        y: 59,
        width: 20,
        height: 14,
        action: {
          type: "popup",
          title: "Desk Note",
          body: "A handwritten note says: replace these placeholders with your real videos, then adjust hotspot positions in src/scenes.ts.",
        },
      },
    ],
  },
};
