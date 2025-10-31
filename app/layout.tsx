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
  title: "Do Jo - Japanese Interview Practice Platform",
  description:
    "Practice Japanese interviews with experienced interviewers. Improve your language skills and interview performance.",
  keywords: [
    "Japanese",
    "interview",
    "practice",
    "learning",
    "language",
    "career",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
