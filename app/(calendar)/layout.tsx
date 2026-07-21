import type { Metadata, Viewport } from "next";
import "../globals.css";

// /calendar 專區的獨立根 layout:給媽媽用的 PWA,不掛 Team Retro 的外框。

export const metadata: Metadata = {
  title: "媽媽的行事曆",
  description: "講一句話,就幫你記進日曆",
  manifest: "/calendar.webmanifest",
  appleWebApp: {
    capable: true,
    title: "行事曆",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/calendar-icon-192.png",
    apple: "/calendar-icon-180.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#e86a33",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function CalendarRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body style={{ background: "#fff8f1", color: "#3a2a20" }}>{children}</body>
    </html>
  );
}
