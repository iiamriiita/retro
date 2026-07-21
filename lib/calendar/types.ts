// 行事曆(/calendar)共用型別

export interface CalendarEvent {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  event_date: string;
  /** HH:MM:SS 或 HH:MM,整天事件為 null */
  event_time: string | null;
  /** 提醒送出時間(ISO),不提醒為 null */
  remind_at: string | null;
  reminded_at: string | null;
  created_at: string;
}

export interface NewCalendarEvent {
  title: string;
  event_date: string;
  event_time: string | null;
  remind_at: string | null;
  raw_input?: string;
}
