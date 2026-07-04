import type { Template } from "./types";
import type { Locale } from "./i18n/messages";

// Shared reserved keys. The mood rating stores under MOOD_KEY (aggregated for
// insights); the role pick stores under ROLE_KEY.
export const MOOD_KEY = "__mood";
export const ROLE_KEY = "role";

type LStr = { en: string; zh: string };
interface I18nOption {
  emoji: string;
  label: LStr;
  desc: LStr;
}
interface I18nScale {
  value: number;
  emoji: string;
  label: LStr;
}
interface I18nQuestion {
  key: string;
  label: LStr;
  placeholder?: LStr;
  type?: "text" | "rating" | "role";
  options?: I18nOption[];
  scale?: I18nScale[];
  lowNudge?: LStr;
}
interface I18nTemplate {
  id: string;
  name: LStr;
  description: LStr;
  intro: LStr;
  questions: I18nQuestion[];
}

function roleQuestion(label: LStr, options: I18nOption[]): I18nQuestion {
  return { key: ROLE_KEY, type: "role", label, options };
}
function moodQuestion(
  label: LStr,
  scale: I18nScale[],
  lowNudge?: LStr,
): I18nQuestion {
  return { key: MOOD_KEY, type: "rating", label, scale, lowNudge };
}

const TEMPLATES_I18N: I18nTemplate[] = [
  /* ───────────────────────── Sailboat ───────────────────────── */
  {
    id: "sailboat",
    name: {
      en: "🚢 Set sail! Our boat",
      zh: "🚢 出航吧！我們這艘船",
    },
    description: {
      en: "A voyage metaphor — wind, anchors, rocks, and the island we're heading for.",
      zh: "航行的比喻——推我們的風、拖住的錨、前方暗礁、想抵達的島。",
    },
    intro: {
      en: "This stretch has been like sailing a boat together. First pick the role that best fits how you've been, then answer the questions!",
      zh: "我們這段時間就像一起航行的一艘船。先選一個最像你這陣子狀態的角色，再回答問題吧！",
    },
    questions: [
      roleQuestion(
        {
          en: "Your role (pick one + say why)",
          zh: "角色選擇（選一個 + 說明為什麼）",
        },
        [
          {
            emoji: "🧭",
            label: { en: "Helm", zh: "舵手" },
            desc: {
              en: "I've been steering, often thinking about where we're headed.",
              zh: "我一直在掌握方向，常在想我們要去哪。",
            },
          },
          {
            emoji: "⛵",
            label: { en: "Sail", zh: "揚帆手" },
            desc: {
              en: "I feel like the wind pushing everyone forward.",
              zh: "我感覺自己是推動大家前進的風力來源。",
            },
          },
          {
            emoji: "⚓",
            label: { en: "Anchored", zh: "拋錨的人" },
            desc: {
              en: "I've been a bit stuck, or hitting the brakes lately.",
              zh: "我這陣子有點卡住，或在踩煞車。",
            },
          },
          {
            emoji: "🔭",
            label: { en: "Lookout", zh: "瞭望員" },
            desc: {
              en: "I mostly observe — I notice things others miss.",
              zh: "我大多在觀察，注意到很多別人沒注意到的事。",
            },
          },
          {
            emoji: "🐙",
            label: { en: "Kraken-slayer", zh: "海怪剋星" },
            desc: {
              en: "I've been handling surprises and putting out fires.",
              zh: "我一直在處理突發狀況和麻煩。",
            },
          },
        ],
      ),
      {
        key: "wind",
        label: {
          en: "💨 Wind: What's pushing us forward? Which practices make us go faster?",
          zh: "💨 風（Wind）：什麼事情在推著我們前進？哪些做法讓我們跑得更快？",
        },
        placeholder: {
          en: "e.g. Daily 15-min syncs keep everyone aligned and moving.",
          zh: "例：每天 15 分鐘同步，大家方向一致、跑得很順。",
        },
      },
      {
        key: "anchor",
        label: {
          en: "⚓ Anchor: What's slowing us down? What makes you feel held back?",
          zh: "⚓ 錨（Anchor）：什麼在拖慢我們？哪些事讓你覺得綁手綁腳？",
        },
        placeholder: {
          en: "e.g. Waiting days for reviews blocks the next piece of work.",
          zh: "例：review 等好幾天，後面的工作被卡住。",
        },
      },
      {
        key: "rocks",
        label: {
          en: "🪨 Rocks: What risks or worries lie ahead that we should steer around early?",
          zh: "🪨 暗礁（Rocks）：前方有什麼風險或隱憂，是我們該提早閃避的？",
        },
        placeholder: {
          en: "e.g. Only one person understands the deploy — a bus-factor risk.",
          zh: "例：只有一個人懂部署，是個風險。",
        },
      },
      {
        key: "island",
        label: {
          en: "🏝️ Island: What are we really trying to reach? What does your ideal destination look like?",
          zh: "🏝️ 島嶼（Island）：我們真正想抵達的目標是什麼？你心中理想的終點長怎樣？",
        },
        placeholder: {
          en: "e.g. Ship weekly with confidence and no fire-drills.",
          zh: "例：能穩定每週出貨，不再臨時救火。",
        },
      },
      moodQuestion(
        {
          en: "⚖️ Voyage satisfaction: how many points for our boat this trip?",
          zh: "⚖️ 航行滿意度：這趟航行，你給我們這艘船打幾分？",
        },
        [
          {
            value: 1,
            emoji: "🌊",
            label: {
              en: "Sinking — taking on water, everyone bailing",
              zh: "快沉船了 — 進水中，大家忙著舀水",
            },
          },
          {
            value: 2,
            emoji: "⛵",
            label: {
              en: "Wobbly — moving but often off course",
              zh: "有點搖晃 — 前進中但常偏航",
            },
          },
          {
            value: 3,
            emoji: "🚢",
            label: {
              en: "Steady cruise — decent pace, roughly right direction",
              zh: "平穩巡航 — 節奏還行，方向大致對",
            },
          },
          {
            value: 4,
            emoji: "🌅",
            label: {
              en: "Smooth sailing — fast and steady, enjoyable",
              zh: "順風破浪 — 跑得又快又穩，很享受",
            },
          },
          {
            value: 5,
            emoji: "🏝️",
            label: {
              en: "Perfect voyage — almost at the ideal island!",
              zh: "完美航程 — 幾乎要抵達理想島嶼了！",
            },
          },
        ],
        {
          en: "Want to share what's making it feel like you're taking on water? Add the specifics in the Anchor / Rocks questions above.",
          zh: "想聊聊是哪裡讓你覺得在進水嗎？可以回上面的錨／暗礁題寫具體原因。",
        },
      ),
    ],
  },

  /* ───────────────────────── Garden ───────────────────────── */
  {
    id: "garden",
    name: { en: "🌱 Little Garden", zh: "🌱 小小花園" },
    description: {
      en: "A garden metaphor — what's blooming, what needs water, weeds, and seeds.",
      zh: "花園的比喻——開花的、需要澆水的、該除的雜草、想播的種子。",
    },
    intro: {
      en: "Think of this stretch as a garden we tend together. Pick the role closest to you!",
      zh: "把這段時間想成一座我們一起照顧的花園。選一個最貼近你的角色吧！",
    },
    questions: [
      roleQuestion(
        {
          en: "Your role (pick one + say why)",
          zh: "角色選擇（選一個 + 說明為什麼）",
        },
        [
          {
            emoji: "🌻",
            label: { en: "Gardener", zh: "園丁" },
            desc: {
              en: "I put a lot of effort into nurturing and helping others grow.",
              zh: "我花很多心力在照顧、幫助別人成長。",
            },
          },
          {
            emoji: "🌱",
            label: { en: "Sprout", zh: "新芽" },
            desc: {
              en: "I'm still learning and growing, soaking up new things.",
              zh: "我還在學習、成長，吸收很多新東西。",
            },
          },
          {
            emoji: "🐝",
            label: { en: "Bee", zh: "蜜蜂" },
            desc: {
              en: "I move between areas, helping connect people.",
              zh: "我在不同地方之間穿梭，幫忙串連大家。",
            },
          },
          {
            emoji: "☔",
            label: { en: "Rain", zh: "雨水" },
            desc: {
              en: "I provided resources or support that nourished the team.",
              zh: "我提供了資源或支援，滋養了團隊。",
            },
          },
          {
            emoji: "🍂",
            label: { en: "Fallen leaf", zh: "落葉" },
            desc: {
              en: "I feel some things should be cleared away or let go.",
              zh: "我覺得有些東西該被清理、放下了。",
            },
          },
        ],
      ),
      {
        key: "blooming",
        label: {
          en: "🌸 Blooming: What grew well this time and is worth celebrating?",
          zh: "🌸 開花的（Blooming）：這段時間有什麼長得很好、值得慶祝的？",
        },
        placeholder: {
          en: "e.g. Our onboarding docs finally paid off — new folks ramped fast.",
          zh: "例：新人文件終於發揮作用，上手很快。",
        },
      },
      {
        key: "needs_water",
        label: {
          en: "💧 Needs water: What's still fragile and needs more attention to thrive?",
          zh: "💧 需要澆水的（Needs Water）：什麼還很脆弱、需要更多關注才能長好？",
        },
        placeholder: {
          en: "e.g. Test coverage is thin in the payments module.",
          zh: "例：付款模組的測試還很薄弱。",
        },
      },
      {
        key: "weeds",
        label: {
          en: "🌿 Weeds: What habit or process is draining nutrients and should be removed?",
          zh: "🌿 該除的雜草（Weeds）：有什麼在消耗養分、該被移除的習慣或流程？",
        },
        placeholder: {
          en: "e.g. Status meetings that could just be a message.",
          zh: "例：其實一則訊息就能取代的進度會。",
        },
      },
      {
        key: "seeds",
        label: {
          en: "🌰 Seeds: What new thing would you like to start growing next season?",
          zh: "🌰 想播的種子（Seeds）：下一季你想開始培養什麼新的東西？",
        },
        placeholder: {
          en: "e.g. A regular pairing slot to spread knowledge.",
          zh: "例：固定的 pairing 時間，把知識散出去。",
        },
      },
      moodQuestion(
        {
          en: "🌡️ Garden health: how's our garden doing right now?",
          zh: "🌡️ 花園健康度：我們這座花園現在長得如何？",
        },
        [
          {
            value: 1,
            emoji: "🥀",
            label: {
              en: "Wilting — no water or sun, barely holding on",
              zh: "快枯了 — 缺水缺陽光，有點撐不住",
            },
          },
          {
            value: 2,
            emoji: "🌵",
            label: {
              en: "Just surviving — not dead, but not growing",
              zh: "勉強活著 — 沒死但也沒在長",
            },
          },
          {
            value: 3,
            emoji: "🌿",
            label: { en: "Steady growth — green and healthy", zh: "穩定生長 — 綠油油，健康" },
          },
          {
            value: 4,
            emoji: "🌻",
            label: {
              en: "Blooming — thriving, starting to fruit",
              zh: "開花中 — 生機盎然，開始結果",
            },
          },
          {
            value: 5,
            emoji: "🌳",
            label: {
              en: "Lush — rich ecosystem, everyone nourished",
              zh: "枝繁葉茂 — 生態豐富，大家都很滋養",
            },
          },
        ],
      ),
    ],
  },

  /* ─────────────────────── Space Mission ─────────────────────── */
  {
    id: "space-mission",
    name: {
      en: "🚀 Mission Control",
      zh: "🚀 任務控制中心",
    },
    description: {
      en: "A space-mission metaphor — liftoff, gravity, alerts, and the next coordinates.",
      zh: "太空任務的比喻——順利發射、重力阻礙、系統警報、下一趟座標。",
    },
    intro: {
      en: "We just wrapped a space mission! Before the debrief, pick your role for this trip.",
      zh: "我們剛完成一趟太空任務！在任務報告前，選一個你這趟的角色。",
    },
    questions: [
      roleQuestion(
        {
          en: "Your role (pick one + say why)",
          zh: "角色選擇（選一個 + 說明為什麼）",
        },
        [
          {
            emoji: "👩‍🚀",
            label: { en: "Astronaut", zh: "太空人" },
            desc: {
              en: "I was on the front line, facing challenges directly.",
              zh: "我在第一線衝鋒，直接面對挑戰。",
            },
          },
          {
            emoji: "🛰️",
            label: { en: "Ground control", zh: "地面指揮" },
            desc: {
              en: "I coordinated, planned, and kept everyone in sync.",
              zh: "我在協調、規劃、確保大家同步。",
            },
          },
          {
            emoji: "🔧",
            label: { en: "Engineer", zh: "工程師" },
            desc: {
              en: "I fixed things and kept everything running.",
              zh: "我在修東西、讓一切正常運轉。",
            },
          },
          {
            emoji: "📡",
            label: { en: "Comms officer", zh: "通訊官" },
            desc: {
              en: "I kept information flowing and everyone on the same page.",
              zh: "我負責讓資訊流通、大家有對上話。",
            },
          },
          {
            emoji: "⭐",
            label: { en: "Stargazer", zh: "觀星者" },
            desc: {
              en: "I looked at the bigger picture and the long-term direction.",
              zh: "我在看更大的圖、想長遠的方向。",
            },
          },
        ],
      ),
      {
        key: "liftoff",
        label: {
          en: "🚀 Liftoff: Where did this mission take off smoothly? What went great?",
          zh: "🚀 成功發射（Liftoff）：這趟任務哪裡順利起飛？什麼進行得很棒？",
        },
        placeholder: {
          en: "e.g. The launch went out on time with zero rollbacks.",
          zh: "例：這次上線準時、零回滾。",
        },
      },
      {
        key: "gravity",
        label: {
          en: "🌍 Gravity: What force kept pulling us down and slowing progress?",
          zh: "🌍 重力阻礙（Gravity）：什麼力量一直把我們往下拉、拖慢進度？",
        },
        placeholder: {
          en: "e.g. Constant context-switching between too many projects.",
          zh: "例：同時做太多專案，一直切換很耗神。",
        },
      },
      {
        key: "alerts",
        label: {
          en: "⚠️ Alerts: What warning signs came up that we should watch next time?",
          zh: "⚠️ 系統警報（Alerts）：任務中出現過哪些警訊，是下次要注意的？",
        },
        placeholder: {
          en: "e.g. We noticed flaky tests but kept ignoring them.",
          zh: "例：測試一直不穩，但我們都先忽略。",
        },
      },
      {
        key: "next_coordinates",
        label: {
          en: "🛸 Next coordinates: Which direction should we adjust for the next mission?",
          zh: "🛸 下一趟座標（Next Coordinates）：下一趟任務你希望我們往哪個方向調整？",
        },
        placeholder: {
          en: "e.g. Fewer parallel projects, more focus per sprint.",
          zh: "例：少開幾條並行專案，每個 sprint 更聚焦。",
        },
      },
      moodQuestion(
        {
          en: "📊 Mission dashboard: what's your reading on the overall mission status?",
          zh: "📊 任務儀表板：這趟任務的整體狀態，你的讀數是？",
        },
        [
          {
            value: 1,
            emoji: "🔴",
            label: {
              en: "Emergency landing — multiple failures, barely survived",
              zh: "緊急迫降 — 系統多處故障，勉強生還",
            },
          },
          {
            value: 2,
            emoji: "🟠",
            label: {
              en: "Constant turbulence — made it, but a bumpy ride",
              zh: "亂流不斷 — 撐過來了但一路顛簸",
            },
          },
          {
            value: 3,
            emoji: "🟡",
            label: { en: "Cruising altitude — running steadily", zh: "巡航高度 — 穩定運行中" },
          },
          {
            value: 4,
            emoji: "🟢",
            label: {
              en: "Full throttle — plenty of power, excellent shape",
              zh: "引擎全開 — 動力充足，狀態極佳",
            },
          },
          {
            value: 5,
            emoji: "⭐",
            label: {
              en: "Perfect mission — textbook, one for the history books",
              zh: "完美任務 — 教科書級表現，可以寫進史冊",
            },
          },
        ],
      ),
    ],
  },
];

function flatten(tpl: I18nTemplate, locale: Locale): Template {
  return {
    id: tpl.id,
    name: tpl.name[locale],
    description: tpl.description[locale],
    intro: tpl.intro[locale],
    questions: tpl.questions.map((q) => ({
      key: q.key,
      label: q.label[locale],
      placeholder: q.placeholder?.[locale],
      type: q.type ?? "text",
      options: q.options?.map((o) => ({
        emoji: o.emoji,
        label: o.label[locale],
        desc: o.desc[locale],
      })),
      scale: q.scale?.map((s) => ({
        value: s.value,
        emoji: s.emoji,
        label: s.label[locale],
      })),
      lowNudge: q.lowNudge?.[locale],
    })),
  };
}

export function getTemplates(locale: Locale = "en"): Template[] {
  return TEMPLATES_I18N.map((t) => flatten(t, locale));
}

export function getTemplate(
  id: string,
  locale: Locale = "en",
): Template | undefined {
  const tpl = TEMPLATES_I18N.find((t) => t.id === id);
  return tpl ? flatten(tpl, locale) : undefined;
}
