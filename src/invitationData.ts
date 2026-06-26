export type HostKey = "b" | "d" | "s" | "m";
export type InvitationLanguage = "en" | "th";

export type QuestionnaireSpecialAction = "redirect" | "too_young" | "continue";

export type QuestionnaireChoice = {
  id: string;
  label: string;
  text: Record<InvitationLanguage, string>;
  scores: Record<HostKey, number>;
  specialAction?: QuestionnaireSpecialAction;
  specialUrl?: string;
  feedback?: Record<InvitationLanguage, string>;
};

export type QuestionnaireQuestion = {
  id: string;
  order: number;
  kind?: "scored" | "special";
  text: Record<InvitationLanguage, string>;
  choices: QuestionnaireChoice[];
};

export type HostScoreMap = Record<HostKey, number>;

export const hostOrder: HostKey[] = ["b", "d", "s", "m"];

export const hostLabels: Record<HostKey, string> = {
  b: "Bluerose",
  d: "Decree",
  s: "Stray",
  m: "Meteor",
};

export const hostRoomByKey: Record<HostKey, string> = {
  b: "B-room",
  d: "D-room",
  s: "S-room",
  m: "M-room",
};

export const hostResultImageByKey: Record<HostKey, string> = {
  b: "/assets/b_result.png",
  d: "/assets/d_result.png",
  s: "/assets/s_result.png",
  m: "/assets/m_result.png",
};

export const fallbackQuestionnaire: QuestionnaireQuestion[] = [
  {
    "id": "q01",
    "order": 1,
    "kind": "scored",
    "text": {
      "en": "Your main interest in experiencing BDSM",
      "th": "ความสนใจหลักของคุณในการสัมผัสประสบการณ์ BDSM"
    },
    "choices": [
      {
        "id": "q01_a",
        "label": "A",
        "text": {
          "en": "Physical",
          "th": "เชิงกายภาพ"
        },
        "scores": {
          "b": 3,
          "d": -1,
          "s": 2,
          "m": 3
        }
      },
      {
        "id": "q01_b",
        "label": "B",
        "text": {
          "en": "Physiological",
          "th": "เชิงจิตวิทยา"
        },
        "scores": {
          "b": -2,
          "d": 2,
          "s": -1,
          "m": 1
        }
      },
      {
        "id": "q01_c",
        "label": "C",
        "text": {
          "en": "All in the same way",
          "th": "สนใจทั้งสองด้านพอ ๆ กัน"
        },
        "scores": {
          "b": -1,
          "d": 1,
          "s": 1,
          "m": 2
        }
      }
    ]
  },
  {
    "id": "q02",
    "order": 2,
    "kind": "scored",
    "text": {
      "en": "How do you feel about being tied up or restrained?",
      "th": "คุณรู้สึกอย่างไรเกี่ยวกับการถูกมัดหรือถูกจำกัดการเคลื่อนไหว?"
    },
    "choices": [
      {
        "id": "q02_a",
        "label": "A",
        "text": {
          "en": "Crave to be tightly bound, helpless, and completely at his mercy",
          "th": "ปรารถนาที่จะถูกมัดแน่น ไร้ซึ่งทางช่วยเหลือ และอยู่ภายใต้ความเมตตาของอีกฝ่ายอย่างสมบูรณ์"
        },
        "scores": {
          "b": 3,
          "d": 1,
          "s": 1,
          "m": -1
        }
      },
      {
        "id": "q02_b",
        "label": "B",
        "text": {
          "en": "Tying, creating intricate rope work, and having them under my control is the best",
          "th": "การมัดผู้อื่น สร้างงานเชือกที่ซับซ้อน และควบคุมผู้อื่นให้อยู่ในอำนาจของฉันคือสิ่งที่ดีที่สุด"
        },
        "scores": {
          "b": 2,
          "d": -1,
          "s": -1,
          "m": 3
        }
      },
      {
        "id": "q02_c",
        "label": "C",
        "text": {
          "en": "Being restrained can be exciting sometimes, but I prefer having the freedom to react, whether I'm the one being controlled or the one in control",
          "th": "การถูกจำกัดการเคลื่อนไหวบางครั้งก็น่าตื่นเต้น แต่ฉันชอบการมีอิสระในการตอบสนองมากกว่า ไม่ว่าจะเป็นการถูกควบคุมหรือเป็นฝ่ายควบคุมก็ตาม"
        },
        "scores": {
          "b": -1,
          "d": 2,
          "s": 2,
          "m": 2
        }
      }
    ]
  },
  {
    "id": "q03",
    "order": 3,
    "kind": "scored",
    "text": {
      "en": "What kind of power dynamic do you prefer?",
      "th": "คุณชื่นชอบบทบาทอำนาจแบบใดในความสัมพันธ์?"
    },
    "choices": [
      {
        "id": "q03_a",
        "label": "A",
        "text": {
          "en": "Fully surrender, serve, and be owned like a devoted slave, pet",
          "th": "การยอมจำนนอย่างสมบูรณ์ รับใช้ และถูกครอบครองเหมือนทาส สัตว์เลี้ยง"
        },
        "scores": {
          "b": 1,
          "d": 3,
          "s": 1,
          "m": -3
        }
      },
      {
        "id": "q03_b",
        "label": "B",
        "text": {
          "en": "Own, command, and take full responsibility as a Master is great",
          "th": "การเป็นเจ้าของสั่งการและรับผิดชอบเต็มที่ในฐานะเจ้านาย คือสิ่งที่ยอดเยี่ยม"
        },
        "scores": {
          "b": -2,
          "d": -2,
          "s": -2,
          "m": 3
        }
      },
      {
        "id": "q03_c",
        "label": "C",
        "text": {
          "en": "Power dynamic is not important for me as long as the experience is exciting.",
          "th": "บทบาทอำนาจไม่สำคัญสำหรับฉันตราบใดที่ประสบการณ์ที่ได้รับนั้นน่าตื่นเต้น"
        },
        "scores": {
          "b": 2,
          "d": -3,
          "s": 2,
          "m": -2
        }
      }
    ]
  },
  {
    "id": "q04",
    "order": 4,
    "kind": "scored",
    "text": {
      "en": "How do you feel about pain or intense physical sensations?",
      "th": "คุณรู้สึกอย่างไรเกี่ยวกับความเจ็บปวดหรือความรู้สึกทางกายภาพที่รุนแรง?"
    },
    "choices": [
      {
        "id": "q04_a",
        "label": "A",
        "text": {
          "en": "I enjoy pain, emotional intensity that pushes me to my limits, and even the lingering marks left behind by those experiences.",
          "th": "ฉันชื่นชอบความเจ็บปวด การถูกบีบคั้นทางอารมณ์ให้ถึงขีดจำกัด รวมถึงร่องรอยของความเจ็บปวดเหล่านั้นบนเรือนร่างของฉันด้วย"
        },
        "scores": {
          "b": 1,
          "d": 1,
          "s": 3,
          "m": -3
        }
      },
      {
        "id": "q04_b",
        "label": "B",
        "text": {
          "en": "I enjoy being the one who inflicts pain and observing the other person's reactions.",
          "th": "ฉันชอบเป็นฝ่ายสร้างความเจ็บปวดและดูปฏิกริยาของอีกฝ่าย"
        },
        "scores": {
          "b": -1,
          "d": -2,
          "s": -2,
          "m": 3
        }
      },
      {
        "id": "q04_c",
        "label": "C",
        "text": {
          "en": "I prefer other forms of excitement over either giving or receiving pain.",
          "th": "ฉันชอบความตื่นเต้นในรูปแบบอื่นมากกว่าการสร้างหรือรับความเจ็บปวด"
        },
        "scores": {
          "b": 2,
          "d": 2,
          "s": -3,
          "m": -2
        }
      }
    ]
  },
  {
    "id": "q05",
    "order": 5,
    "kind": "scored",
    "text": {
      "en": "Your preferred role in BDSM",
      "th": "บทบาทที่คุณชื่นชอบใน BDSM"
    },
    "choices": [
      {
        "id": "q05_a",
        "label": "A",
        "text": {
          "en": "Dominant",
          "th": "Dominant"
        },
        "scores": {
          "b": 1,
          "d": 1,
          "s": -2,
          "m": 3
        }
      },
      {
        "id": "q05_b",
        "label": "B",
        "text": {
          "en": "Submissive",
          "th": "Submissive"
        },
        "scores": {
          "b": 1,
          "d": 2,
          "s": 3,
          "m": -3
        }
      },
      {
        "id": "q05_c",
        "label": "C",
        "text": {
          "en": "Still uncertain",
          "th": "ยังไม่แน่ใจ"
        },
        "scores": {
          "b": 2,
          "d": 1,
          "s": 2,
          "m": 1
        }
      }
    ]
  },
  {
    "id": "q06",
    "order": 6,
    "kind": "scored",
    "text": {
      "en": "How advanced you are with BDSM?",
      "th": "คุณเปิดกว้างแค่ไหนในการลองประสบการณ์ใหม่ ๆ เกี่ยวกับ BDSM"
    },
    "choices": [
      {
        "id": "q06_a",
        "label": "A",
        "text": {
          "en": "Beginner",
          "th": "ฉันชอบลองอะไรใหม่ ๆ เสมออย่างน้อยสักครั้ง"
        },
        "scores": {
          "b": 1,
          "d": 2,
          "s": 2,
          "m": 1
        }
      },
      {
        "id": "q06_b",
        "label": "B",
        "text": {
          "en": "Intermediate",
          "th": "ฉันมักจะลองประสบการณ์ที่เกี่ยวกับการยอมจำนน, ถูกมัด, หรือความเจ็บปวด"
        },
        "scores": {
          "b": 3,
          "d": 3,
          "s": 3,
          "m": -3
        }
      },
      {
        "id": "q06_c",
        "label": "C",
        "text": {
          "en": "Advance",
          "th": "ฉันมักจะลองประสบการณ์ที่เกี่ยวกับการควบคุม มีอำนาจ หรือความโหดร้าย"
        },
        "scores": {
          "b": -3,
          "d": -3,
          "s": -3,
          "m": 3
        }
      }
    ]
  },
  {
    "id": "q07",
    "order": 7,
    "kind": "scored",
    "text": {
      "en": "Your opinion on consent",
      "th": "ทัศนคติของคุณเกี่ยวกับความสมยอม(consent)"
    },
    "choices": [
      {
        "id": "q07_a",
        "label": "A",
        "text": {
          "en": "Consent is absolute, non-negotiable.",
          "th": "เป็นสิ่งที่ต้องมีอย่างเด็ดขาด ยืดหยุ่นไม่ได้"
        },
        "scores": {
          "b": 3,
          "d": 1,
          "s": 3,
          "m": 1
        }
      },
      {
        "id": "q07_b",
        "label": "B",
        "text": {
          "en": "Pushing boundary and consent is what make thing spicy.",
          "th": "เป็นสิ่งที่ยืดหยุ่นได้ การต่อรองหรือผลักเส้นความสมยอมนิดๆ หน่อย ๆ เป็นเรื่องน่าสนุก"
        },
        "scores": {
          "b": -3,
          "d": -3,
          "s": -3,
          "m": -3
        }
      },
      {
        "id": "q07_c",
        "label": "C",
        "text": {
          "en": "There’s nothing money and power cannot buy, including consent.",
          "th": "ความสมยอม? ไม่มีอะไรที่เงินและอำนาจซื้อไม่ได้หรอก"
        },
        "scores": {
          "b": -100,
          "d": -100,
          "s": -100,
          "m": -100
        }
      }
    ]
  },
  {
    "id": "q08",
    "order": 8,
    "kind": "scored",
    "text": {
      "en": "Do you enjoy initiating conversations with strangers?",
      "th": "คุณชอบเป็นคนเริ่มบทสนทนากับคนแปลกหน้า"
    },
    "choices": [
      {
        "id": "q08_a",
        "label": "A",
        "text": {
          "en": "yes, I like to initiate conversations with strangers.",
          "th": "ใช่ ฉันชอบเริ่มบทสนทนาก่อน"
        },
        "scores": {
          "b": 3,
          "d": -1,
          "s": 2,
          "m": 1
        }
      },
      {
        "id": "q08_b",
        "label": "B",
        "text": {
          "en": "It depends on the situation.",
          "th": "แล้วแต่สถานการณ์"
        },
        "scores": {
          "b": 3,
          "d": 1,
          "s": 2,
          "m": 1
        }
      },
      {
        "id": "q08_c",
        "label": "C",
        "text": {
          "en": "I don't know how to start conversations",
          "th": "ฉันไม่รู้จะเริ่มบทสนทนาก่อนอย่างไร"
        },
        "scores": {
          "b": 2,
          "d": 1,
          "s": 3,
          "m": -1
        }
      }
    ]
  },
  {
    "id": "q09",
    "order": 9,
    "kind": "scored",
    "text": {
      "en": "If you encounter an activity you don't want to do, you should...",
      "th": "หากคุณเจอกับกิจกรรมที่ไม่ต้องการ คุณควรจะ"
    },
    "choices": [
      {
        "id": "q09_a",
        "label": "A",
        "text": {
          "en": "Be patient for the host's pleasure.",
          "th": "อดทนเพื่อความพึงพอใจของโฮสต์"
        },
        "scores": {
          "b": 0,
          "d": 0,
          "s": 0,
          "m": 0
        }
      },
      {
        "id": "q09_b",
        "label": "B",
        "text": {
          "en": "Strongly refused.",
          "th": "ปฏิเสธอย่างรุนแรง กล้าดียังไง"
        },
        "scores": {
          "b": 0,
          "d": 0,
          "s": 0,
          "m": 0
        }
      },
      {
        "id": "q09_c",
        "label": "C",
        "text": {
          "en": "Use a safe word or safe gesture to stop all activity.",
          "th": "ใช้ safe word หรือ safe gesture เพื่อหยุดทุกกิจกรรม"
        },
        "scores": {
          "b": 0,
          "d": 0,
          "s": 0,
          "m": 0
        }
      }
    ]
  },
  {
    "id": "q10",
    "order": 10,
    "kind": "scored",
    "text": {
      "en": "What is most important for a club member's promotion?",
      "th": "สิ่งใดสำคัญที่สุดในการเลื่อนขั้นของสมาชิกคลับ"
    },
    "choices": [
      {
        "id": "q10_a",
        "label": "A",
        "text": {
          "en": "Money",
          "th": "เงิน"
        },
        "scores": {
          "b": 0,
          "d": 0,
          "s": 0,
          "m": 0
        }
      },
      {
        "id": "q10_b",
        "label": "B",
        "text": {
          "en": "Power",
          "th": "อำนาจ"
        },
        "scores": {
          "b": 0,
          "d": 0,
          "s": 0,
          "m": 0
        }
      },
      {
        "id": "q10_c",
        "label": "C",
        "text": {
          "en": "Credibility / Trust",
          "th": "ความน่าเชื่อถือ"
        },
        "scores": {
          "b": 0,
          "d": 0,
          "s": 0,
          "m": 0
        }
      }
    ]
  },
  {
    "id": "q11",
    "order": 11,
    "kind": "special",
    "text": {
      "en": "Do you like P' Bird Thongchai?",
      "th": "คุณชอบพี่เบิร์ดหรือไม่"
    },
    "choices": [
      {
        "id": "q11_a",
        "label": "A",
        "text": {
          "en": "YES, I LIKE HIM",
          "th": "ชอบสิ! พี่เบิร์ดเลยนะ"
        },
        "scores": {
          "b": 0,
          "d": 0,
          "s": 0,
          "m": 0
        },
        "specialAction": "redirect",
        "specialUrl": "https://youtu.be/RW8BJBCsYP0"
      },
      {
        "id": "q11_b",
        "label": "B",
        "text": {
          "en": "NO, I DONT LIKE",
          "th": "ไม่ชอบอะ แก่จัง"
        },
        "scores": {
          "b": 0,
          "d": 0,
          "s": 0,
          "m": 0
        },
        "specialAction": "redirect",
        "specialUrl": "https://youtu.be/XR4BP3SfPPs?si=rKiYWLygPT3tq1gL"
      },
      {
        "id": "q11_c",
        "label": "C",
        "text": {
          "en": "WHAT? WHO?",
          "th": "ใครอะ?"
        },
        "scores": {
          "b": 0,
          "d": 0,
          "s": 0,
          "m": 0
        },
        "specialAction": "too_young",
        "feedback": {
          "en": "you are too young",
          "th": "อายุไม่ถึง"
        }
      },
      {
        "id": "q11_d",
        "label": "D",
        "text": {
          "en": "So, is it a joke or is it sexy?",
          "th": "สรุปพี่จะกาวหรือจะเสียว"
        },
        "scores": {
          "b": 0,
          "d": 0,
          "s": 0,
          "m": 0
        },
        "specialAction": "continue",
        "feedback": {
          "en": "Let's go back to asking regular questions.",
          "th": "กลับไปทำคำถามปกติต่อ"
        }
      }
    ]
  }
];

export const fallbackInvitationCodes: Record<HostKey, string[]> = {
  b: ["B-ROSE-001"],
  d: ["D-DECREE-001"],
  s: ["S-STRAY-001"],
  m: ["M-METEOR-001"],
};
