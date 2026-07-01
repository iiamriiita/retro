import type { Template } from "./types";

// Three built-in questionnaires. Placeholders show an example sentence to nudge
// filler-inners toward concrete, behaviour-focused, actionable feedback.
export const TEMPLATES: Template[] = [
  {
    id: "start-stop-continue",
    name: "經典 Start / Stop / Continue",
    description: "最通用的回顧框架：該開始、該停止、該持續的事。",
    questions: [
      {
        key: "start",
        label: "我們應該「開始」做什麼？",
        placeholder: "例：開始在 PR 描述裡寫測試步驟，reviewer 才能快速驗證。",
      },
      {
        key: "stop",
        label: "我們應該「停止」做什麼？",
        placeholder: "例：停止在沒有 issue 的情況下直接改 main，容易衝突。",
      },
      {
        key: "continue",
        label: "我們應該「繼續」做什麼？",
        placeholder: "例：繼續每天早上 15 分鐘同步進度，資訊很順暢。",
      },
    ],
  },
  {
    id: "4ls",
    name: "4Ls（Liked / Learned / Lacked / Longed for）",
    description: "從喜歡、學到、缺少、期待四個面向回顧。",
    questions: [
      {
        key: "liked",
        label: "這段期間你「喜歡」的部分？",
        placeholder: "例：喜歡我們把大功能拆成小 PR，review 壓力小很多。",
      },
      {
        key: "learned",
        label: "你「學到」了什麼？",
        placeholder: "例：學到先寫測試再實作，能更早發現邊界問題。",
      },
      {
        key: "lacked",
        label: "覺得「缺少」了什麼？",
        placeholder: "例：缺少一份共用的環境設定文件，新人上手很慢。",
      },
      {
        key: "longed",
        label: "你「期待」但沒發生的是什麼？",
        placeholder: "例：期待能有固定的技術分享時間，但一直排不進去。",
      },
    ],
  },
  {
    id: "peer-review",
    name: "同儕互評（引導式給回饋）",
    description: "對事不對人的引導式互評，聚焦具體行為與可行動建議。",
    questions: [
      {
        key: "helpful_behavior",
        label: "對方哪個具體行為讓你覺得很有幫助？（請舉例）",
        placeholder: "例：你在我卡住時主動來 pair，30 分鐘就把問題解掉了。",
      },
      {
        key: "could_improve",
        label: "有沒有哪個情境，對方換個做法會更好？（對事不對人）",
        placeholder: "例：上次 PR 一次改了 40 個檔案，希望之後能拆小一點。",
      },
      {
        key: "try_next",
        label: "你希望對方在下一階段多嘗試什麼？",
        placeholder: "例：希望你能多在設計階段就丟出想法，讓大家早點對齊。",
      },
    ],
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
