// Fast, client-side pre-filter for blatant personal insults / slurs (中英).
// This is a first pass only — it catches obvious cases instantly without an LLM
// call. The LLM (/api/moderate) does the nuanced "constructive vs emotional"
// judgement. Keep this list focused on words used to attack a *person*; do not
// add general negative words (回饋本來就可以是負面的).

export const BLOCKLIST: string[] = [
  // 中文人身攻擊 / 髒話
  "廢物",
  "垃圾",
  "白痴",
  "白癡",
  "智障",
  "低能",
  "腦殘",
  "蠢貨",
  "沒用的東西",
  "去死",
  "滾蛋",
  "幹你",
  "幹妳",
  "他媽的",
  "媽的",
  "婊子",
  "混蛋",
  "王八蛋",
  "賤",
  // English personal insults
  "idiot",
  "stupid",
  "moron",
  "retard",
  "loser",
  "useless piece",
  "worthless",
  "dumbass",
  "asshole",
  "fuck you",
  "shut up",
];

export interface BlocklistHit {
  hit: boolean;
  term?: string;
}

// Returns the first matched term, if any. Case-insensitive.
export function checkBlocklist(text: string): BlocklistHit {
  const lower = text.toLowerCase();
  for (const term of BLOCKLIST) {
    if (lower.includes(term.toLowerCase())) {
      return { hit: true, term };
    }
  }
  return { hit: false };
}
