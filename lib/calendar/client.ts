// 行事曆前端小工具:帶 PIN 的 fetch、推播訂閱。只能從 client component 匯入。

const PIN_KEY = "calendar_pin";

export function getStoredPin(): string {
  try {
    return localStorage.getItem(PIN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function storePin(pin: string) {
  try {
    localStorage.setItem(PIN_KEY, pin);
  } catch {
    /* Safari 私密瀏覽等情況,忽略 */
  }
}

export class CalendarApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** 對 /api/calendar/* 的 fetch,自動附上 PIN;非 2xx 會丟 CalendarApiError。 */
export async function calFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-calendar-pin": getStoredPin(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = "發生錯誤,請再試一次";
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* 保留預設訊息 */
    }
    throw new CalendarApiError(res.status, message);
  }
  return (await res.json()) as T;
}

// ---------- Web Push ----------

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export type EnablePushResult =
  | "granted"
  | "denied"
  | "unsupported"
  | "no-key"
  | "error";

/** 註冊 service worker、要通知權限、訂閱推播並回報給後端。 */
export async function enablePush(): Promise<EnablePushResult> {
  if (!pushSupported()) return "unsupported";
  const vapidKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").trim();
  if (!vapidKey) return "no-key";

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "denied";

    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      }));

    await calFetch("/api/calendar/subscriptions", {
      method: "POST",
      body: JSON.stringify(subscription.toJSON()),
    });
    return "granted";
  } catch (err) {
    console.error("enablePush failed", err);
    return "error";
  }
}
