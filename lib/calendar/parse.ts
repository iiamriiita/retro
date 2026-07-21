// =============================================================================
// 中文口語 → 行事曆事件 解析器(純規則,不用 AI、不用網路)
//
// 「下週三下午三點帶妹妹回診」
//   → { date: "2026-07-29", time: "15:00", title: "帶妹妹回診" }
//
// 支援的句型:
//   日期:今天/明天/後天/大後天、(這|本|下|下下)週三、週五、8月3號、8/3、
//        15號、三天後
//   時間:下午三點、早上8點半、晚上七點十五分、中午12點、15:30、下午3:00
//   沒講的部分回傳 null,由確認畫面讓使用者補。
// =============================================================================

export interface ParsedEvent {
  title: string;
  /** YYYY-MM-DD,解析不到為 null */
  date: string | null;
  /** HH:MM(24 小時制),解析不到為 null */
  time: string | null;
  /** 原句中被視為日期的文字(顯示用) */
  dateText: string | null;
  /** 原句中被視為時間的文字(顯示用) */
  timeText: string | null;
}

const ZH_DIGITS: Record<string, number> = {
  "〇": 0, 零: 0, 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4,
  五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

/** "三"→3、"十"→10、"十五"→15、"二十一"→21、"12"→12。無法解析回傳 null。 */
function toInt(raw: string): number | null {
  const s = raw.trim();
  if (/^[0-9]+$/.test(s)) return parseInt(s, 10);
  // 中文數字:[X]十[Y] 或單一數字
  const m = s.match(/^([一二兩三四五六七八九])?(十)?([一二兩三四五六七八九])?$/);
  if (!m || (!m[1] && !m[2] && !m[3])) {
    return s.length === 1 && s in ZH_DIGITS ? ZH_DIGITS[s] : null;
  }
  if (!m[2]) return m[1] && !m[3] ? ZH_DIGITS[m[1]] : null;
  return (m[1] ? ZH_DIGITS[m[1]] : 1) * 10 + (m[3] ? ZH_DIGITS[m[3]] : 0);
}

// 數字片段:阿拉伯數字或中文數字(最多「二十一」三個字)
const NUM = "(?:[0-9]{1,2}|[〇零一二兩三四五六七八九十]{1,3})";

const WEEKDAY: Record<string, number> = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/** 全形數字/冒號轉半形,順便去掉空白干擾。 */
function normalize(input: string): string {
  return input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[：]/g, ":")
    .replace(/[ 　]/g, " ");
}

interface Span {
  start: number;
  end: number;
  text: string;
}

/** 依序嘗試各日期句型,回傳計算出的日期與命中的文字範圍。 */
function extractDate(s: string, today: Date): { date: Date; span: Span } | null {
  // 1) 相對日:大後天 > 後天 > 明天 > 今天(長的先比,避免「大後天」只吃到「後天」)
  const rel = s.match(/大後天|後天|明天|今天/);
  if (rel && rel.index !== undefined) {
    const offset = { 今天: 0, 明天: 1, 後天: 2, 大後天: 3 }[rel[0]]!;
    return {
      date: addDays(today, offset),
      span: { start: rel.index, end: rel.index + rel[0].length, text: rel[0] },
    };
  }

  // 2) 週幾:(這|本|下|下下)?(週|星期|禮拜)X
  const wk = s.match(/(下下|下|這|本)?(週|周|星期|禮拜)([一二三四五六日天])/);
  if (wk && wk.index !== undefined) {
    const target = WEEKDAY[wk[3]];
    const dow = ((today.getDay() + 6) % 7) + 1; // 週一=1 … 週日=7
    let date: Date;
    if (!wk[1]) {
      // 沒有修飾詞 →「接下來最近的那個週X」(今天就算是也往後推一週)
      let delta = (target - dow + 7) % 7;
      if (delta === 0) delta = 7;
      date = addDays(today, delta);
    } else {
      const weeks = wk[1] === "下下" ? 2 : wk[1] === "下" ? 1 : 0;
      const monday = addDays(today, 1 - dow);
      date = addDays(monday, weeks * 7 + (target - 1));
    }
    return {
      date,
      span: { start: wk.index, end: wk.index + wk[0].length, text: wk[0] },
    };
  }

  // 3) X月Y號 / X月Y日 / X月Y
  const md = s.match(new RegExp(`(${NUM})月(${NUM})[號日]?`));
  if (md && md.index !== undefined) {
    const month = toInt(md[1]);
    const day = toInt(md[2]);
    if (month && day && month <= 12 && day <= 31) {
      let date = new Date(today.getFullYear(), month - 1, day);
      if (date < today) date = new Date(today.getFullYear() + 1, month - 1, day);
      return {
        date,
        span: { start: md.index, end: md.index + md[0].length, text: md[0] },
      };
    }
  }

  // 4) 8/3 這種斜線寫法(月/日)
  const slash = s.match(/(?<![0-9:])([0-9]{1,2})\/([0-9]{1,2})(?![0-9])/);
  if (slash && slash.index !== undefined) {
    const month = parseInt(slash[1], 10);
    const day = parseInt(slash[2], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      let date = new Date(today.getFullYear(), month - 1, day);
      if (date < today) date = new Date(today.getFullYear() + 1, month - 1, day);
      return {
        date,
        span: { start: slash.index, end: slash.index + slash[0].length, text: slash[0] },
      };
    }
  }

  // 5) Y號 / Y日(只講日 → 這個月,過了就下個月)
  const dayOnly = s.match(new RegExp(`(${NUM})[號日]`));
  if (dayOnly && dayOnly.index !== undefined) {
    const day = toInt(dayOnly[1]);
    if (day && day >= 1 && day <= 31) {
      let date = new Date(today.getFullYear(), today.getMonth(), day);
      if (date < today) {
        date = new Date(today.getFullYear(), today.getMonth() + 1, day);
      }
      return {
        date,
        span: {
          start: dayOnly.index,
          end: dayOnly.index + dayOnly[0].length,
          text: dayOnly[0],
        },
      };
    }
  }

  // 6) N天後
  const after = s.match(new RegExp(`(${NUM})天[後后]`));
  if (after && after.index !== undefined) {
    const n = toInt(after[1]);
    if (n !== null) {
      return {
        date: addDays(today, n),
        span: { start: after.index, end: after.index + after[0].length, text: after[0] },
      };
    }
  }

  return null;
}

const PERIOD =
  "(凌晨|清晨|一早|早上|上午|中午|下午|傍晚|晚上|晚間|半夜)";

/** 依時段詞把 1–12 點換算成 24 小時制。 */
function adjustHour(hour: number, period: string | undefined): number {
  switch (period) {
    case "凌晨":
    case "清晨":
    case "半夜":
      return hour === 12 ? 0 : hour;
    case "一早":
    case "早上":
    case "上午":
      return hour === 12 ? 0 : hour;
    case "中午":
      return hour <= 3 ? hour + 12 : 12;
    case "下午":
    case "傍晚":
    case "晚上":
    case "晚間":
      return hour < 12 ? hour + 12 : hour;
    default:
      // 沒講時段:1–7 點當下午(看診多在白天),8–11 當早上,12 當中午
      if (hour >= 1 && hour <= 7) return hour + 12;
      return hour;
  }
}

function extractTime(s: string): { time: string; span: Span } | null {
  // 1) 下午3:30 / 15:30
  const colon = s.match(new RegExp(`${PERIOD}?\\s*([0-9]{1,2}):([0-9]{2})`));
  if (colon && colon.index !== undefined) {
    let hour = parseInt(colon[2], 10);
    const minute = parseInt(colon[3], 10);
    if (hour <= 23 && minute <= 59) {
      if (colon[1] || hour <= 12) hour = adjustHour(hour, colon[1]);
      if (hour <= 23) {
        return {
          time: `${pad(hour)}:${pad(minute)}`,
          span: { start: colon.index, end: colon.index + colon[0].length, text: colon[0] },
        };
      }
    }
  }

  // 2) 下午三點半 / 早上8點15分 / 晚上七點
  const zh = s.match(
    new RegExp(`${PERIOD}?\\s*(${NUM})[點点](半|整|(${NUM})分?)?`),
  );
  if (zh && zh.index !== undefined) {
    const rawHour = toInt(zh[2]);
    if (rawHour !== null && rawHour <= 24) {
      let minute = 0;
      if (zh[3] === "半") minute = 30;
      else if (zh[4]) minute = toInt(zh[4]) ?? 0;
      if (minute <= 59) {
        const hour = rawHour <= 12 ? adjustHour(rawHour, zh[1]) : rawHour;
        if (hour <= 23) {
          return {
            time: `${pad(hour)}:${pad(minute)}`,
            span: { start: zh.index, end: zh.index + zh[0].length, text: zh[0] },
          };
        }
      }
    }
  }

  return null;
}

/** 把命中的片段從原句移除,剩下的就是事件標題。 */
function buildTitle(s: string, spans: Span[]): string {
  const sorted = [...spans].sort((a, b) => b.start - a.start);
  let out = s;
  for (const span of sorted) {
    out = out.slice(0, span.start) + " " + out.slice(span.end);
  }
  return out
    .replace(/\s+/g, " ")
    .replace(/^[\s,，、。.的在於]+/, "")
    .replace(/[\s,，、。.!！?？~～]+$/, "")
    .trim();
}

export function parseZhEvent(input: string, now: Date = new Date()): ParsedEvent {
  const s = normalize(input);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dateHit = extractDate(s, today);
  const timeHit = extractTime(
    // 先把日期片段挖掉再找時間,避免「8月3號」的數字被誤認成時間
    dateHit
      ? s.slice(0, dateHit.span.start) +
          " ".repeat(dateHit.span.end - dateHit.span.start) +
          s.slice(dateHit.span.end)
      : s,
  );

  const spans: Span[] = [];
  if (dateHit) spans.push(dateHit.span);
  if (timeHit) spans.push(timeHit.span);

  return {
    title: buildTitle(s.replace(/ /g, " "), spans).replace(/ /g, ""),
    date: dateHit ? fmtDate(dateHit.date) : null,
    time: timeHit ? timeHit.time : null,
    dateText: dateHit ? dateHit.span.text : null,
    timeText: timeHit ? timeHit.span.text.trim() : null,
  };
}

// ---------- 顯示用小工具(前端共用) ----------

const WEEKDAY_LABEL = ["日", "一", "二", "三", "四", "五", "六"];

/** "2026-07-29" → 「7月29日(週三)」 */
export function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}月${d}日(週${WEEKDAY_LABEL[date.getDay()]})`;
}

/** "15:00" → 「下午 3:00」 */
export function formatTimeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 6 ? "凌晨" : h < 12 ? "早上" : h < 18 ? "下午" : "晚上";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${h12}:${pad(m)}`;
}

/** 相對稱呼:今天/明天/後天,其餘回 null。 */
export function relativeDayLabel(iso: string, now: Date = new Date()): string | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = iso.split("-").map(Number);
  const diff = Math.round(
    (new Date(y, m - 1, d).getTime() - today.getTime()) / 86400000,
  );
  return diff === 0 ? "今天" : diff === 1 ? "明天" : diff === 2 ? "後天" : null;
}
