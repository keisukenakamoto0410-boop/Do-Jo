"use client";

// メダル定義
export const MEDALS: Record<string, { emoji: string; name: string; nameJa: string; description: string }> = {
  // 初回系
  first_session: {
    emoji: "🎉",
    name: "First Step",
    nameJa: "はじめの一歩",
    description: "Completed your first conversation session",
  },
  // セッション数系
  sessions_5: {
    emoji: "⭐",
    name: "Rising Star",
    nameJa: "ライジングスター",
    description: "Completed 5 conversation sessions",
  },
  sessions_10: {
    emoji: "🌟",
    name: "Dedicated Learner",
    nameJa: "熱心な学習者",
    description: "Completed 10 conversation sessions",
  },
  sessions_25: {
    emoji: "💫",
    name: "Conversation Master",
    nameJa: "会話マスター",
    description: "Completed 25 conversation sessions",
  },
  sessions_50: {
    emoji: "👑",
    name: "Japanese Expert",
    nameJa: "日本語エキスパート",
    description: "Completed 50 conversation sessions",
  },
  // トピック系
  topic_food: {
    emoji: "🍣",
    name: "Food Explorer",
    nameJa: "グルメ探検家",
    description: "Completed a session about Japanese food",
  },
  "topic_japanese-culture": {
    emoji: "🎌",
    name: "Culture Enthusiast",
    nameJa: "文化愛好家",
    description: "Completed a session about Japanese culture",
  },
  topic_travel: {
    emoji: "🗻",
    name: "Virtual Traveler",
    nameJa: "バーチャル旅行者",
    description: "Completed a session about travel in Japan",
  },
  "topic_daily-life": {
    emoji: "🏠",
    name: "Daily Life Expert",
    nameJa: "日常生活マスター",
    description: "Completed a session about daily life",
  },
  topic_hobbies: {
    emoji: "🎮",
    name: "Hobby Talker",
    nameJa: "趣味トーカー",
    description: "Completed a session about hobbies",
  },
  topic_work: {
    emoji: "💼",
    name: "Business Talker",
    nameJa: "ビジネス会話者",
    description: "Completed a session about work",
  },
};

interface MedalDisplayProps {
  medals: string[];
  showAll?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function MedalDisplay({ medals, showAll = false, size = "md" }: MedalDisplayProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-lg",
    md: "w-12 h-12 text-2xl",
    lg: "w-16 h-16 text-3xl",
  };

  if (medals.length === 0 && !showAll) {
    return null;
  }

  const displayMedals = showAll ? Object.keys(MEDALS) : medals;

  return (
    <div className="flex flex-wrap gap-2">
      {displayMedals.map((medalType) => {
        const medal = MEDALS[medalType];
        const isEarned = medals.includes(medalType);

        if (!medal) return null;

        return (
          <div
            key={medalType}
            className={`relative group ${!isEarned && showAll ? "opacity-30 grayscale" : ""}`}
          >
            <div
              className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-amber-200 shadow-md border-2 border-amber-300`}
            >
              {medal.emoji}
            </div>

            {/* ツールチップ */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              <div className="font-bold">{medal.name}</div>
              <div className="text-gray-300">{medal.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 新規獲得メダル表示用モーダル
interface NewMedalsModalProps {
  medals: string[];
  onClose: () => void;
}

export function NewMedalsModal({ medals, onClose }: NewMedalsModalProps) {
  if (medals.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-bounce-in">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Congratulations!
        </h2>
        <p className="text-gray-600 mb-6">
          You earned {medals.length === 1 ? "a new medal" : `${medals.length} new medals`}!
        </p>

        <div className="flex justify-center gap-4 mb-6">
          {medals.map((medalType) => {
            const medal = MEDALS[medalType];
            if (!medal) return null;

            return (
              <div key={medalType} className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-amber-200 shadow-lg border-4 border-amber-400 text-4xl mb-2 mx-auto">
                  {medal.emoji}
                </div>
                <div className="font-bold text-gray-900">{medal.name}</div>
                <div className="text-xs text-gray-500">{medal.nameJa}</div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
        >
          Awesome!
        </button>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
