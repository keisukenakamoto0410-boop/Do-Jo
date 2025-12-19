import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Do Jo - 日本人と外国人をつなぐビデオ通話プラットフォーム",
  description:
    "25分間のビデオ通話で、本物の日本語会話を体験しよう。日本人シニア・大学生と外国人学習者をマッチング。",
  keywords: [
    "日本語",
    "会話練習",
    "ビデオ通話",
    "マッチング",
    "国際交流",
    "Japanese",
    "conversation",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
