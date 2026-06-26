export type SceneId =
  | "atrium"
  | "door"
  | "archive"
  | "lineup"
  | "inside"
  | "B-room"
  | "B-desk"
  | "B-sofa"
  | "D-room"
  | "D-desk"
  | "D-sofa"
  | "S-room"
  | "S-desk"
  | "S-sofa"
  | "M-room"
  | "M-desk"
  | "M-sofa";

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
  hitbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
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
  } | {
    type: "path";
    path: string;
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
        action: {
          type: "scene",
          target: "D-room",
        },
      },
      {
        id: "inside-door-center-right",
        label: "S door",
        x: 61,
        y: 20.4,
        width: 13.7,
        height: 72.3,
        imageSrc: "/assets/black.png",
        action: {
          type: "scene",
          target: "S-room",
        },
      },
      {
        id: "inside-door-right",
        label: "M door",
        x: 69.7,
        y: 14.9,
        width: 13.9,
        height: 95.4,
        imageSrc: "/assets/blue.png",
        action: {
          type: "scene",
          target: "M-room",
        },
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
        hitbox: {
          x: 34,
          y: 42,
          width: 32,
          height: 36,
        },
        action: {
          type: "path",
          path: "/b-mini-game",
          audioSrc: "/assets/bell-ring.mp3",
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
        hitbox: {
          x: 8,
          y: 20,
          width: 84,
          height: 44,
        },
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
  "D-room": {
    id: "D-room",
    name: "",
    videoSrc: "/assets/d room.mp4",
    posterSrc: "/assets/d_room_1.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-d-room",
    overlays: [
      {
        id: "d-item-1",
        label: "D item 1",
        src: "/assets/d_item_1.png",
        x: 36.1,
        y: 63.1,
        width: 13.8,
        action: {
          type: "scene",
          target: "D-desk",
          audioSrc: "/assets/whoosp.mp3",
        },
      },
      {
        id: "d-item-2",
        label: "D item 2",
        src: "/assets/d_item_2.png",
        x: 52.1,
        y: 67.2,
        width: 9.2,
        action: {
          type: "path",
          path: "/d-mini-game",
          audioSrc: "/assets/bell-ring.mp3",
        },
      },
      {
        id: "d-item-3",
        label: "D item 3",
        src: "/assets/d_item_3.png",
        x: 44.4,
        y: 58.6,
        width: 12.2,
        action: {
          type: "scene",
          target: "D-sofa",
          audioSrc: "/assets/whoosp.mp3",
        },
      },
      {
        id: "d-item-4",
        label: "D item 4",
        src: "/assets/d_item_4.png",
        x: 21.2,
        y: 79.3,
        width: 11.6,
        action: {
          type: "image",
          imageSrc: "/assets/lyrics_d.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
    hotspots: [
      {
        id: "d-wall-image",
        label: "Wall image",
        x: 32.4,
        y: 11.6,
        width: 36.5,
        height: 35.2,
        action: {
          type: "image",
          imageSrc: "/assets/d_wall.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
  },
  "D-desk": {
    id: "D-desk",
    name: "",
    videoSrc: "/assets/d room profile.mp4",
    posterSrc: "/assets/d-desk.PNG",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-d-room",
    hotspots: [
      {
        id: "d-host-profile",
        label: "Host Profile",
        x: 15.8,
        y: 5.2,
        width: 40.2,
        height: 89.6,
        action: {
          type: "image",
          imageSrc: "/assets/d_profile.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
  },
  "D-sofa": {
    id: "D-sofa",
    name: "",
    videoSrc: "/assets/d room sofa.mp4",
    posterSrc: "/assets/d-sofa.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-d-room",
    overlays: [
      {
        id: "d-photo",
        label: "Photo",
        src: "/assets/photo2.png",
        x: 22.8,
        y: 22.4,
        width: 67.6,
        action: {
          type: "gallery",
          imageSrcs: [
            "/assets/d1.png",
            "/assets/d2.png",
            "/assets/d3.png",
            "/assets/d4.png",
            "/assets/d5.png",
            "/assets/d6.png",
            "/assets/d7.png",
            "/assets/d8.png",
            "/assets/d9.png",
            "/assets/d10.png",
          ],
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
    hotspots: [],
  },
  "S-room": {
    id: "S-room",
    name: "",
    videoSrc: "/assets/s room.mp4",
    posterSrc: "/assets/s_room_1.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-s-room",
    overlays: [
      {
        id: "s-item-1",
        label: "S item 1",
        src: "/assets/s_item_1.png",
        x: 48.9,
        y: 60.2,
        width: 14.2,
        action: {
          type: "scene",
          target: "S-desk",
          audioSrc: "/assets/whoosp.mp3",
        },
      },
      {
        id: "s-item-2",
        label: "S item 2",
        src: "/assets/s_item_2.png",
        x: 39.5,
        y: 65.8,
        width: 8.1,
        action: {
          type: "path",
          path: "/s-mini-game",
          audioSrc: "/assets/bell-ring.mp3",
        },
      },
      {
        id: "s-item-3",
        label: "S item 3",
        src: "/assets/s_item_3.png",
        x: 61.3,
        y: 57.9,
        width: 13.6,
        action: {
          type: "scene",
          target: "S-sofa",
          audioSrc: "/assets/whoosp.mp3",
        },
      },
      {
        id: "s-item-4",
        label: "S item 4",
        src: "/assets/s_item_4.png",
        x: 22.4,
        y: 58.4,
        width: 15.2,
        action: {
          type: "image",
          imageSrc: "/assets/lyrics_s.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
    hotspots: [
      {
        id: "s-wall-image",
        label: "Wall image",
        x: 31.4,
        y: 8.6,
        width: 38.5,
        height: 40.2,
        action: {
          type: "image",
          imageSrc: "/assets/s_wall.webp",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
  },
  "S-desk": {
    id: "S-desk",
    name: "",
    videoSrc: "/assets/s room profile.mp4",
    posterSrc: "/assets/s-desk.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-s-room",
    hotspots: [
      {
        id: "s-host-profile",
        label: "Host Profile",
        x: 52.2,
        y: 3.6,
        width: 35.1,
        height: 91.4,
        action: {
          type: "image",
          imageSrc: "/assets/s_profile.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
  },
  "S-sofa": {
    id: "S-sofa",
    name: "",
    videoSrc: "/assets/s room sofa.mp4",
    posterSrc: "/assets/s-sofa.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-s-room",
    overlays: [
      {
        id: "s-photo",
        label: "Photo",
        src: "/assets/photo3.png",
        x: 18.8,
        y: 26.4,
        width: 70.6,
        action: {
          type: "gallery",
          imageSrcs: [
            "/assets/s1.webp",
            "/assets/s2.webp",
            "/assets/s3.webp",
            "/assets/s4.webp",
            "/assets/s5.webp",
            "/assets/s6.webp",
            "/assets/s7.webp",
            "/assets/s8.webp",
            "/assets/s9.webp",
            "/assets/s10.webp",
          ],
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
    hotspots: [],
  },
  "M-room": {
    id: "M-room",
    name: "",
    videoSrc: "/assets/m room.mp4",
    posterSrc: "/assets/m_room_1.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-m-room",
    overlays: [
      {
        id: "m-item-1",
        label: "M item 1",
        src: "/assets/m_item_1.png",
        x: 52.9,
        y: 64.1,
        width: 18.2,
        action: {
          type: "scene",
          target: "M-desk",
          audioSrc: "/assets/whoosp.mp3",
        },
      },
      {
        id: "m-item-2",
        label: "M item 2",
        src: "/assets/m_item_2.png",
        x: 33.8,
        y: 70.4,
        width: 8.1,
        action: {
          type: "path",
          path: "/m-mini-game",
          audioSrc: "/assets/bell-ring.mp3",
        },
      },
      {
        id: "m-item-3",
        label: "M item 3",
        src: "/assets/m_item_3.png",
        x: 36.4,
        y: 58.2,
        width: 14.6,
        action: {
          type: "scene",
          target: "M-sofa",
          audioSrc: "/assets/whoosp.mp3",
        },
      },
      {
        id: "m-item-4",
        label: "M item 4",
        src: "/assets/m_item_4.png",
        x: 41.6,
        y: 73.5,
        width: 13.2,
        action: {
          type: "image",
          imageSrc: "/assets/lyrics_m.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
    hotspots: [
      {
        id: "m-wall-image",
        label: "Wall image",
        x: 33.4,
        y: 8.6,
        width: 33.5,
        height: 40.2,
        action: {
          type: "image",
          imageSrc: "/assets/m_wall.jpg",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
  },
  "M-desk": {
    id: "M-desk",
    name: "",
    videoSrc: "/assets/m room profile.mp4",
    posterSrc: "/assets/m-desk.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-m-room",
    hotspots: [
      {
        id: "m-host-profile",
        label: "Host Profile",
        x: 15.8,
        y: 5.2,
        width: 40.2,
        height: 89.6,
        action: {
          type: "image",
          imageSrc: "/assets/m_profile.png",
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
  },
  "M-sofa": {
    id: "M-sofa",
    name: "",
    videoSrc: "/assets/m room sofa.mp4",
    posterSrc: "/assets/m-sofa.png",
    aspectRatio: 16 / 9,
    fallbackClassName: "fallback-m-room",
    overlays: [
      {
        id: "m-photo",
        label: "Photo",
        src: "/assets/photo4.png",
        x: 25.8,
        y: 32.4,
        width: 61.6,
        action: {
          type: "gallery",
          imageSrcs: [
            "/assets/m1.jpg",
            "/assets/m2.jpg",
            "/assets/m3.jpg",
            "/assets/m4.jpg",
            "/assets/m5.jpg",
            "/assets/m6.jpg",
            "/assets/m7.jpg",
            "/assets/m8.jpg",
            "/assets/m9.jpg",
            "/assets/m10.jpg",
          ],
          audioSrc: "/assets/flip.mp3",
        },
      },
    ],
    hotspots: [],
  },
};
