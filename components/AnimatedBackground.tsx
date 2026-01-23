"use client";

import { useEffect, useState } from "react";

// 日本語フレーズデータ（全て3文字以内）
const phrases = [
  // 日常フレーズ
  { ja: "やば", en: "amazing" },
  { ja: "かわ", en: "cute" },
  { ja: "すご", en: "awesome" },
  { ja: "マジ", en: "seriously" },
  { ja: "えも", en: "emotional" },
  { ja: "草", en: "lol" },
  // オノマトペ
  { ja: "ドキ", en: "heart beat" },
  { ja: "わく", en: "excited" },
  { ja: "もふ", en: "fluffy" },
  { ja: "キラ", en: "sparkling" },
  { ja: "ふわ", en: "soft" },
  { ja: "ぴか", en: "shiny" },
  // 若者言葉・スラング
  { ja: "推し", en: "favorite" },
  { ja: "神", en: "god-tier" },
  { ja: "尊い", en: "precious" },
  { ja: "沼", en: "obsessed" },
  { ja: "映え", en: "photogenic" },
  { ja: "ガチ", en: "for real" },
  // 文化・感情
  { ja: "粋", en: "stylish" },
  { ja: "縁", en: "fate" },
  { ja: "和", en: "harmony" },
  { ja: "侘び", en: "wabi" },
  { ja: "寂び", en: "sabi" },
  { ja: "癒し", en: "healing" },
  // 挨拶・礼儀
  { ja: "乙", en: "good work" },
  { ja: "よろ", en: "nice 2 meet" },
  { ja: "あざ", en: "thanks" },
  { ja: "了解", en: "roger" },
  { ja: "無理", en: "impossible" },
  { ja: "最高", en: "the best" },
];

// フレーズを3つのグループに分割
const row1Phrases = phrases.slice(0, 10);
const row2Phrases = phrases.slice(10, 20);
const row3Phrases = phrases.slice(20, 30);

// アイコンカラーのバリエーション
const iconColors = [
  { bg: "rgba(0, 168, 204, 0.15)", border: "rgba(0, 168, 204, 0.3)", text: "#006B7D" },
  { bg: "rgba(255, 107, 53, 0.15)", border: "rgba(255, 107, 53, 0.3)", text: "#E64A19" },
  { bg: "rgba(255, 167, 38, 0.15)", border: "rgba(255, 167, 38, 0.3)", text: "#F57C00" },
  { bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)", text: "#059669" },
  { bg: "rgba(139, 92, 246, 0.15)", border: "rgba(139, 92, 246, 0.3)", text: "#7C3AED" },
];

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  showBottomRow?: boolean;
  phrasesInBackground?: boolean;
}

export default function AnimatedBackground({ children, showBottomRow = false, phrasesInBackground = false }: AnimatedBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // フレーズ行をレンダリング（円形アイコンスタイル）
  const renderPhraseRow = (phraseList: typeof phrases, direction: "left" | "right", opacity: number) => {
    const tripled = [...phraseList, ...phraseList, ...phraseList];
    return (
      <div
        className="flex whitespace-nowrap items-center"
        style={{
          animation: `scroll-${direction} ${direction === "left" ? "50s" : "55s"} linear infinite`,
          opacity: isLoaded ? opacity : 0,
          transition: "opacity 0.5s ease-in-out",
        }}
      >
        {tripled.map((phrase, i) => {
          const color = iconColors[i % iconColors.length];
          return (
            <div
              key={i}
              className="flex flex-col items-center mx-4 md:mx-6"
            >
              {/* 円形アイコン */}
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-2 border-2 shadow-lg"
                style={{
                  background: color.bg,
                  borderColor: color.border,
                  backdropFilter: "blur(8px)",
                }}
              >
                <span
                  className="text-lg md:text-2xl font-bold"
                  style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    color: color.text,
                  }}
                >
                  {phrase.ja.slice(0, 3)}
                </span>
              </div>
              {/* 英語の意味 */}
              <span
                className="text-[10px] md:text-xs text-center max-w-[80px] md:max-w-[100px] truncate"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  color: "#566573",
                }}
              >
                {phrase.en}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;600;800&display=swap');

        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }

        @keyframes scroll-right {
          0% { transform: translateX(-33.33%); }
          100% { transform: translateX(0); }
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      <div className="min-h-screen relative overflow-hidden">
        {/* グラデーション背景 */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #F8FAFB 0%, #E6F7FB 50%, #FFF3EE 100%)",
          }}
        />

        {/* グラデーションオーブ */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
          style={{
            background: "radial-gradient(circle, #00A8CC 0%, transparent 70%)",
            top: "-200px",
            right: "-200px",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, #FF6B35 0%, transparent 70%)",
            bottom: "-150px",
            left: "-150px",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-25 blur-3xl"
          style={{
            background: "radial-gradient(circle, #FFA726 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* スクロールフレーズ - 上部 */}
        <div className={`absolute top-[2%] md:top-[3%] left-0 right-0 overflow-hidden pointer-events-none ${phrasesInBackground ? 'z-0' : 'z-10'}`}>
          {renderPhraseRow(row1Phrases, "left", phrasesInBackground ? 0.5 : 0.8)}
        </div>

        {/* スクロールフレーズ - 中上部 */}
        <div className={`absolute top-[14%] md:top-[16%] left-0 right-0 overflow-hidden pointer-events-none ${phrasesInBackground ? 'z-0' : 'z-10'}`}>
          {renderPhraseRow(row2Phrases, "right", phrasesInBackground ? 0.4 : 0.6)}
        </div>

        {/* スクロールフレーズ - 下部（オプション） */}
        {showBottomRow && (
          <div className={`absolute bottom-[3%] md:bottom-[5%] left-0 right-0 overflow-hidden pointer-events-none ${phrasesInBackground ? 'z-0' : 'z-10'}`}>
            {renderPhraseRow(row3Phrases, "left", phrasesInBackground ? 0.4 : 0.7)}
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="relative z-10">
          {children}
        </div>

      </div>
    </>
  );
}
