import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Noto_Sans_SC } from "next/font/google";

import { SITE_NAME, SITE_URL } from "@/lib/site";

import "./globals.css";

const bodyFont = Noto_Sans_SC({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: "查看老年陪伴助手 Android 应用的使用情况、关键流程和异常提醒。",
  openGraph: {
    title: SITE_NAME,
    description: "聚焦老年陪伴助手 Android 应用的使用概况与运营观察。",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "zh_CN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--surface-0)] text-[var(--ink-1)]">{children}</body>
    </html>
  );
}
