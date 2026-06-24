export type SceneId = "atrium" | "door" | "archive" | "lineup" | "inside" | "B-room" | "B-desk" | "B-sofa";

export type Language = "en" | "th";

export type LocalizedImageSrcs = Record<Language, string>;

export type LocalizedGallerySrcs = Record<Language, string[]>;

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
      localizedImageSrcs?: LocalizedImageSrcs;
      audioSrc?: string;
    }
  | {
      type: "gallery";
      imageSrcs: string[];
      localizedImageSrcs?: LocalizedGallerySrcs;
      audioSrc?: string;
    };

export type Hotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageSrc?: string;
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
    localizedImageSrcs?: LocalizedImageSrcs;
    audioSrc?: string;
  } | {
    type: "gallery";
    imageSrcs: string[];
    localizedImageSrcs?: LocalizedGallerySrcs;
    audioSrc?: string;
  } | {
    type: "audio-sequence";
    audioSrcs: string[];
    subtitleText?: string;
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
        x: 16,
        y: 15.4,
        width: 22.2,
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
          localizedImageSrcs: {
            en: [
              "/assets/b-room-en.png",
              "/assets/d-room-en.png",
              "/assets/s-room-en.png",
              "/assets/m-room-en.png",
            ],
            th: [
              "/assets/b-room-th.png",
              "/assets/d-room-th.png",
              "/assets/s-room-th.png",
              "/assets/m-room-th.png",
            ],
          },
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
          localizedImageSrcs: {
            en: "/assets/member_en.png",
            th: "/assets/member_th.png",
          },
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
          localizedImageSrcs: {
            en: ["/assets/rule_en_1.png", "/assets/rule_en_2.png"],
            th: ["/assets/rule_th_1.png", "/assets/rule_th_2.png"],
          },
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
          imageSrc: "/assets/b_cover.webp",
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
          imageSrc: "/assets/d_cover.webp",
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
          imageSrc: "/assets/s_cover.webp",
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
          imageSrc: "/assets/m_cover.webp",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
  },
  inside: {
    id: "inside",
    name: "",
    videoSrc: "/assets/inside.mp4",
    posterSrc: "/assets/inside.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-inside",
    hotspots: [
      {
        id: "inside-door-left",
        label: "B door",
        x: 15.1,
        y: 14.8,
        width: 17.3,
        height: 80.2,
        imageSrc: "/assets/green.png",
        action: {
          type: "scene",
          target: "B-room",
        },
      },
      {
        id: "inside-door-center-left",
        label: "D door",
        x: 26.2,
        y: 23.9,
        width: 12.2,
        height: 62.7,
        imageSrc: "/assets/red.png",
      },
      {
        id: "inside-door-center-right",
        label: "S door",
        x: 61,
        y: 20.4,
        width: 13.7,
        height: 72.3,
        imageSrc: "/assets/black.png",
      },
      {
        id: "inside-door-right",
        label: "M door",
        x: 69.7,
        y: 14.9,
        width: 13.9,
        height: 95.4,
        imageSrc: "/assets/blue.png",
      },
    ],
  },
  "B-room": {
    id: "B-room",
    name: "",
    videoSrc: "/assets/b room.mp4",
    posterSrc: "/assets/b_room_1.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-b-room",
    overlays: [
      {
        id: "b-item-1",
        label: "B item 1",
        src: "/assets/b_item_1.png",
        x: 53.6,
        y: 66.4,
        width: 9.2,
        action: {
          type: "audio-sequence",
          audioSrcs: ["/assets/bell-ring.mp3", "/assets/rosen_voice.mp3"],
          subtitleText: "โอเค ๆ! ขอเวลาผมแป๊บนึงนะ ที่รัก! ผมไม่ได้จะไปไหนหรอก เดี๋ยวก็ได้เจอกันแล้ว!",
        },
      },
      {
        id: "b-item-2",
        label: "B item 2",
        src: "/assets/b_item_2.png",
        x: 34.6,
        y: 53.4,
        width: 18.2,
        action: {
          type: "scene",
          target: "B-desk",
          audioSrc: "/assets/whoosp.mp3",
        },
      },
      {
        id: "b-item-3",
        label: "B item 3",
        src: "/assets/b_item_3.png",
        x: 79.8,
        y: 60.6,
        width: 12.8,
        action: {
          type: "image",
          imageSrc: "/assets/lyrics_b.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
      {
        id: "b-item-4",
        label: "B item 4",
        src: "/assets/b_item_4.png",
        x: 48.8,
        y: 55.8,
        width: 15.4,
        action: {
          type: "scene",
          target: "B-sofa",
          audioSrc: "/assets/whoosp.mp3",
        },
      },
    ],
    hotspots: [
      {
        id: "b-wall-image",
        label: "Wall image",
        x: 31.9,
        y: 9.2,
        width: 37.4,
        height: 41.8,
        action: {
          type: "image",
          imageSrc: "/assets/b_wall.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
  },
  "B-desk": {
    id: "B-desk",
    name: "",
    videoSrc: "/assets/b room profile.mp4",
    posterSrc: "/assets/b-desk.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-b-room",
    hotspots: [
      {
        id: "b-host-profile",
        label: "Host Profile",
        x: 15.8,
        y: 5.2,
        width: 40.2,
        height: 89.6,
        action: {
          type: "image",
          imageSrc: "/assets/b_profile.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
  },
  "B-sofa": {
    id: "B-sofa",
    name: "",
    videoSrc: "/assets/b room sofa.mp4",
    posterSrc: "/assets/b-sofa.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-b-room",
    overlays: [
      {
        id: "b-photo",
        label: "Photo",
        src: "/assets/photo1.png",
        x: 23.8,
        y: 39.4,
        width: 65.6,
        action: {
          type: "gallery",
          imageSrcs: [
            "/assets/b1.png",
            "/assets/b2.png",
            "/assets/b3.png",
            "/assets/b4.png",
            "/assets/b5.png",
            "/assets/b6.png",
            "/assets/b7.png",
            "/assets/b8.png",
            "/assets/b9.png",
            "/assets/b10.png",
          ],
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
    hotspots: [],
  },
};
