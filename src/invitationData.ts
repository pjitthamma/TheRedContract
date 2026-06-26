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
  b: "/assets/b-result.png",
  d: "/assets/d-result.png",
  s: "/assets/s-result.png",
  m: "/assets/m-result.png",
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
          "b": 0,
          "d": 0,
          "s": 0,
          "m": 0
        },
        "specialAction": "too_young",
        "feedback": {
          "en": "Is that truly what you believe? Then I am afraid our club may not be the place for you, sweetheart.",
          "th": "นั่นคือสิ่งที่คุณเชื่อจริง ๆ หรือ? ถ้าอย่างนั้นฉันเกรงว่าคลับของเราอาจไม่ใช่สถานที่สำหรับคุณนะที่รัก"
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
        },
        "specialAction": "too_young",
        "feedback": {
          "en": "Though it is rather adorable, that is not what you should do. Pleasure belongs to both of us. Try reviewing the rules again, sweetheart.",
          "th": "แม้ว่าจะน่าเอ็นดู แต่นั่นไม่ใช่สิ่งที่คุณควรทำ ความพึงพอใจเป็นของพวกเราทั้งสองฝ่าย ลองกลับไปทบทวนกฏใหม่ก่อนนะที่รัก"
        }
      },
      {
        "id": "q09_b",
        "label": "B",
        "text": {
          "en": "How Dare You!",
          "th": "กล้าดียังไง!"
        },
        "scores": {
          "b": 0,
          "d": 0,
          "s": 0,
          "m": 0
        },
        "specialAction": "too_young",
        "feedback": {
          "en": "Sweetheart, that is exactly why we use safe words and safe gestures. Take a moment to calm yourself, then read the rules again.",
          "th": "ที่รัก เรามีการใช้ safe word และ safe gesture เพื่อการนี้ ลองสงบสติอารมณ์แล้วกลับไปอ่านกฏดูอีกครั้ง"
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
        },
        "specialAction": "too_young",
        "feedback": {
          "en": "Money is something you need to enter the club, but it is not the most important thing when it comes to ranking up. Think carefully, sweetheart. Did you forget something in our rules?",
          "th": "เงินเป็นสิ่งที่คุณจำเป็นต้องมีในการเข้าคลับ แต่นั่นไม่ใช่สิ่งที่สำคัญที่สุดในการเลื่อนขั้น นึกดูดี ๆ ที่รัก คุณลืมอะไรไปในกฏกติกาของเราหรือเปล่า"
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
        },
        "specialAction": "too_young",
        "feedback": {
          "en": "Power is not something you can use to rank up here. If you still do not understand that, try reviewing the rules again, sweetheart.",
          "th": "อำนาจไม่ใช่สิ่งที่คุณจะใช้สำหรับการเลื่อนขั้นที่นี่ได้ ถ้าคุณยังไม่เข้าใจตรงนี้ ลองกลับไปทบทวนกฏดูอีกครั้งนะที่รัก"
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
          "en": "Sweetheart… aren’t you a little too young to be here?",
          "th": "ที่รัก คุณเด็กเกินไปที่จะมาที่นี่รึเปล่านะ?"
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
  b: ["B-TRC-7VQ2-KN9A", "B-TRC-M4X8-RD2L", "B-TRC-Q9N3-VY6C", "B-TRC-2KLA-8FQ7", "B-TRC-X5D9-MR3B", "B-TRC-8PQA-L4X2", "B-TRC-N6V3-CY9D", "B-TRC-3RKM-Q7LA", "B-TRC-L9X2-VF5C", "B-TRC-C4NA-8QKD", "B-TRC-Y7M5-RX2P", "B-TRC-F2Q9-LC6V", "B-TRC-K8DA-M3YN", "B-TRC-V5X7-QP2L", "B-TRC-A9C4-RM6K", "B-TRC-Q3VL-8N2D", "B-TRC-6KXR-Y5PA", "B-TRC-M2CN-7Q4F", "B-TRC-R8LD-X9V3", "B-TRC-5YQA-K2MC", "B-TRC-X4N7-FV8L", "B-TRC-C9PQ-3RDA", "B-TRC-L6V2-MX5K", "B-TRC-2DYA-Q8NC", "B-TRC-K5RM-7X4V", "B-TRC-V9LC-3QPA", "B-TRC-A2XF-M6YD", "B-TRC-Q7KN-8C3L", "B-TRC-R4VM-5PXA", "B-TRC-6YDL-Q9KC"],
  d: ["D-TRC-A8K2-VQ5M", "D-TRC-R6N9-XC3L", "D-TRC-4VYD-K7QA", "D-TRC-M2F8-PL9X", "D-TRC-Q5C3-NR6D", "D-TRC-9LVA-K2XM", "D-TRC-C7Q4-RY8N", "D-TRC-X3MD-6PQA", "D-TRC-5KRN-V9LC", "D-TRC-L8C2-QX7D", "D-TRC-Y4VA-M6PK", "D-TRC-2QND-R8XL", "D-TRC-F9KC-3VYM", "D-TRC-M5XA-L7QR", "D-TRC-8DCP-N2VK", "D-TRC-Q6YL-4RMA", "D-TRC-K3VN-X9CD", "D-TRC-7LQP-5MYA", "D-TRC-C2XR-8VNK", "D-TRC-A6MD-Q4PL", "D-TRC-R9YC-3KXV", "D-TRC-V5QA-L8DN", "D-TRC-4XKM-C7PR", "D-TRC-N2VL-9YQA", "D-TRC-L6RD-5XMC", "D-TRC-Q8PA-K3VN", "D-TRC-3CXL-M9YD", "D-TRC-Y7KQ-2RVA", "D-TRC-M4VN-8LCP", "D-TRC-X6DA-Q5KR"],
  s: ["S-TRC-K9V4-RA2X", "S-TRC-7MQL-D5CN", "S-TRC-X3F8-PV6K", "S-TRC-N2CA-9YRD", "S-TRC-5LQ7-MX4S", "S-TRC-R8KD-2VQA", "S-TRC-C4XN-7LPM", "S-TRC-Y9VA-K3QD", "S-TRC-6MRL-X8CN", "S-TRC-Q2PY-5VKA", "S-TRC-L7DC-R9XM", "S-TRC-3KVA-Q6YN", "S-TRC-V8PL-2RCD", "S-TRC-M5XQ-7KLA", "S-TRC-A9CN-4VYD", "S-TRC-X2MR-Q8LP", "S-TRC-6YKD-C3VA", "S-TRC-R5QL-9XMN", "S-TRC-K7PC-2DYA", "S-TRC-N4VX-M8QR", "S-TRC-Q9LA-5KCD", "S-TRC-3VYM-R7XP", "S-TRC-L2CN-8QDA", "S-TRC-Y6RK-4MVP", "S-TRC-C8XA-N5QL", "S-TRC-7DPM-K9VR", "S-TRC-M3QC-X6LA", "S-TRC-A5VN-2RYK", "S-TRC-Q4XL-8CDP", "S-TRC-R6YA-M9KV"],
  m: ["M-TRC-V8N3-QK5L", "M-TRC-2XRA-F9CD", "M-TRC-Q6M4-LV7N", "M-TRC-K5D9-YP2A", "M-TRC-7CXL-R3VQ", "M-TRC-A9KY-4MVD", "M-TRC-L2QN-X8CP", "M-TRC-R6VA-5DYM", "M-TRC-C3XP-9KQL", "M-TRC-Y7ND-R2MA", "M-TRC-5VKC-L8QX", "M-TRC-Q9PR-3YDA", "M-TRC-M4XL-6CVN", "M-TRC-8KQA-R5DP", "M-TRC-X2VN-7LYC", "M-TRC-D6CM-Q9RA", "M-TRC-L5YP-3KXV", "M-TRC-R8ND-M2QA", "M-TRC-4CXL-V7KP", "M-TRC-Y9VA-Q6MD", "M-TRC-K3PR-8LCN", "M-TRC-2VQM-X5DA", "M-TRC-Q7KL-R9YC", "M-TRC-C6DN-4MVP", "M-TRC-A8XR-L2QK", "M-TRC-5YPC-N7VA", "M-TRC-R4MD-Q8XL", "M-TRC-X9KA-3CVP", "M-TRC-L6QN-5RYD", "M-TRC-7VXA-K2MC"],
};
