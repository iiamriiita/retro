import type { Template } from "./types";
import type { Locale } from "./i18n/messages";

type LStr = { en: string; zh: string };
interface I18nQuestion {
  key: string;
  label: LStr;
  placeholder: LStr;
}
interface I18nTemplate {
  id: string;
  name: LStr;
  description: LStr;
  questions: I18nQuestion[];
}

// Three built-in questionnaires. Placeholders show an example sentence to nudge
// filler-inners toward concrete, behaviour-focused, actionable feedback.
const TEMPLATES_I18N: I18nTemplate[] = [
  {
    id: "start-stop-continue",
    name: {
      en: "Classic Start / Stop / Continue",
      zh: "經典 Start / Stop / Continue",
    },
    description: {
      en: "The most universal frame: what to start, stop, and keep doing.",
      zh: "最通用的回顧框架：該開始、該停止、該持續的事。",
    },
    questions: [
      {
        key: "start",
        label: {
          en: "What should we START doing?",
          zh: "我們應該「開始」做什麼？",
        },
        placeholder: {
          en: "e.g. Start writing test steps in PR descriptions so reviewers can verify quickly.",
          zh: "例：開始在 PR 描述裡寫測試步驟，reviewer 才能快速驗證。",
        },
      },
      {
        key: "stop",
        label: {
          en: "What should we STOP doing?",
          zh: "我們應該「停止」做什麼？",
        },
        placeholder: {
          en: "e.g. Stop pushing to main without an issue — it causes conflicts.",
          zh: "例：停止在沒有 issue 的情況下直接改 main，容易衝突。",
        },
      },
      {
        key: "continue",
        label: {
          en: "What should we CONTINUE doing?",
          zh: "我們應該「繼續」做什麼？",
        },
        placeholder: {
          en: "e.g. Keep the 15-minute morning sync — information flows well.",
          zh: "例：繼續每天早上 15 分鐘同步進度，資訊很順暢。",
        },
      },
    ],
  },
  {
    id: "4ls",
    name: {
      en: "4Ls (Liked / Learned / Lacked / Longed for)",
      zh: "4Ls（Liked / Learned / Lacked / Longed for）",
    },
    description: {
      en: "Reflect across four angles: liked, learned, lacked, longed for.",
      zh: "從喜歡、學到、缺少、期待四個面向回顧。",
    },
    questions: [
      {
        key: "liked",
        label: {
          en: "What did you LIKE about this period?",
          zh: "這段期間你「喜歡」的部分？",
        },
        placeholder: {
          en: "e.g. I liked splitting big features into small PRs — much less review pressure.",
          zh: "例：喜歡我們把大功能拆成小 PR，review 壓力小很多。",
        },
      },
      {
        key: "learned",
        label: { en: "What did you LEARN?", zh: "你「學到」了什麼？" },
        placeholder: {
          en: "e.g. Writing tests before implementing surfaces edge cases earlier.",
          zh: "例：學到先寫測試再實作，能更早發現邊界問題。",
        },
      },
      {
        key: "lacked",
        label: { en: "What was LACKING?", zh: "覺得「缺少」了什麼？" },
        placeholder: {
          en: "e.g. We lacked a shared environment-setup doc, so onboarding was slow.",
          zh: "例：缺少一份共用的環境設定文件，新人上手很慢。",
        },
      },
      {
        key: "longed",
        label: {
          en: "What did you LONG FOR but didn't happen?",
          zh: "你「期待」但沒發生的是什麼？",
        },
        placeholder: {
          en: "e.g. I hoped for a regular tech-sharing slot, but it never got scheduled.",
          zh: "例：期待能有固定的技術分享時間，但一直排不進去。",
        },
      },
    ],
  },
  {
    id: "peer-review",
    name: {
      en: "Peer review (guided feedback)",
      zh: "同儕互評（引導式給回饋）",
    },
    description: {
      en: "Guided peer feedback about behaviour, not people — concrete and actionable.",
      zh: "對事不對人的引導式互評，聚焦具體行為與可行動建議。",
    },
    questions: [
      {
        key: "helpful_behavior",
        label: {
          en: "Which specific behaviour of theirs helped you? (give an example)",
          zh: "對方哪個具體行為讓你覺得很有幫助？（請舉例）",
        },
        placeholder: {
          en: "e.g. You paired with me when I was stuck and we solved it in 30 minutes.",
          zh: "例：你在我卡住時主動來 pair，30 分鐘就把問題解掉了。",
        },
      },
      {
        key: "could_improve",
        label: {
          en: "Any situation where a different approach would work better? (about the work, not the person)",
          zh: "有沒有哪個情境，對方換個做法會更好？（對事不對人）",
        },
        placeholder: {
          en: "e.g. Last PR changed 40 files at once — smaller chunks would help next time.",
          zh: "例：上次 PR 一次改了 40 個檔案，希望之後能拆小一點。",
        },
      },
      {
        key: "try_next",
        label: {
          en: "What would you like them to try more of next?",
          zh: "你希望對方在下一階段多嘗試什麼？",
        },
        placeholder: {
          en: "e.g. I'd love you to share ideas earlier in the design phase so we align sooner.",
          zh: "例：希望你能多在設計階段就丟出想法，讓大家早點對齊。",
        },
      },
    ],
  },
];

function flatten(tpl: I18nTemplate, locale: Locale): Template {
  return {
    id: tpl.id,
    name: tpl.name[locale],
    description: tpl.description[locale],
    questions: tpl.questions.map((q) => ({
      key: q.key,
      label: q.label[locale],
      placeholder: q.placeholder[locale],
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
