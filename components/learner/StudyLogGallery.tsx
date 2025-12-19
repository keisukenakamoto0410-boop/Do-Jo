"use client";

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Link from "next/link";

interface StudyLog {
  id: string;
  imageUrl: string;
  imageOrder: number;
  uploadedAt: string;
  analysisResult?: {
    extracted_data: {
      difficulty_level: string;
      topic_category: string;
    };
    ai_generated_output: {
      praise_comment: string;
    };
  };
  hostReactions?: {
    liked: boolean;
    likeCount: number;
    stamps: string[];
    hostComment?: string;
  };
  reservation: {
    id: string;
    host: {
      name: string;
      avatar?: string;
    };
  };
}

interface StudyLogGalleryProps {
  userId: string;
}

export default function StudyLogGallery({ userId }: StudyLogGalleryProps) {
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudyLogs();
  }, [userId]);

  const fetchStudyLogs = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/study-logs?limit=12`);
      const data = await response.json();
      setStudyLogs(data.studyLogs || []);
    } catch (error) {
      console.error("Failed to fetch study logs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-64">
              <div className="h-48 bg-gray-200 rounded-xl mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (studyLogs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-3xl">📚</span>
          あなたの学習記録
        </h2>
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg font-medium">まだ学習記録がありません</p>
          <p className="text-sm mt-2">セッション前に写真を提出しましょう！</p>
          <Link
            href="/learner/reservations"
            className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            予約一覧を見る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-3xl">📚</span>
          あなたの学習記録
        </h2>
        <Link
          href="/learner/study-logs"
          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
        >
          すべて見る
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <style jsx global>{`
        .study-log-swiper .swiper-button-next,
        .study-log-swiper .swiper-button-prev {
          background: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .study-log-swiper .swiper-button-next:after,
        .study-log-swiper .swiper-button-prev:after {
          font-size: 16px;
          font-weight: bold;
          color: #374151;
        }
        .study-log-swiper .swiper-button-disabled {
          opacity: 0.3;
        }
      `}</style>

      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={16}
        slidesPerView={1}
        breakpoints={{
          480: { slidesPerView: 1.5 },
          640: { slidesPerView: 2 },
          768: { slidesPerView: 2.5 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 4 },
        }}
        className="study-log-swiper"
      >
        {studyLogs.map((log) => (
          <SwiperSlide key={log.id}>
            <StudyLogCard log={log} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

function StudyLogCard({ log }: { log: StudyLog }) {
  const reactions = log.hostReactions || {
    liked: false,
    likeCount: 0,
    stamps: [],
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const uploaded = new Date(date);
    const diffMs = now.getTime() - uploaded.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "今日";
    if (diffDays === 1) return "昨日";
    if (diffDays < 7) return `${diffDays}日前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
    return `${Math.floor(diffDays / 30)}ヶ月前`;
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-100">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={log.imageUrl}
          alt={`Study ${log.imageOrder}`}
          className="w-full h-full object-cover"
        />

        {/* Host avatar badge */}
        <div className="absolute top-2 left-2 flex items-center space-x-1 bg-white bg-opacity-95 rounded-full px-2 py-1 shadow-sm">
          {log.reservation.host.avatar ? (
            <img
              src={log.reservation.host.avatar}
              alt={log.reservation.host.name}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {log.reservation.host.name[0]}
            </div>
          )}
          <span className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
            {log.reservation.host.name}
          </span>
        </div>

        {/* Like count badge */}
        {reactions.likeCount > 0 && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full px-2.5 py-1 font-bold text-sm flex items-center space-x-1 shadow-lg">
            <span>❤️</span>
            <span>{reactions.likeCount}</span>
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Stamps */}
        {reactions.stamps.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {reactions.stamps.slice(0, 5).map((stamp, i) => (
              <span
                key={i}
                className="text-xl bg-gray-50 rounded-lg p-1 hover:scale-110 transition-transform"
              >
                {stamp}
              </span>
            ))}
            {reactions.stamps.length > 5 && (
              <span className="text-gray-400 text-sm self-center ml-1">
                +{reactions.stamps.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {log.analysisResult?.extracted_data.difficulty_level && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {log.analysisResult.extracted_data.difficulty_level}
            </span>
          )}
          {log.analysisResult?.extracted_data.topic_category && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {log.analysisResult.extracted_data.topic_category}
            </span>
          )}
        </div>

        {/* Host comment */}
        {reactions.hostComment && (
          <div className="bg-yellow-50 border-l-2 border-yellow-400 rounded-r-lg p-2 mb-2">
            <p className="text-sm text-gray-700 italic line-clamp-2">
              &ldquo;{reactions.hostComment}&rdquo;
            </p>
          </div>
        )}

        {/* AI praise comment */}
        {log.analysisResult?.ai_generated_output.praise_comment && (
          <p className="text-sm text-purple-700 mb-2 line-clamp-2">
            {log.analysisResult.ai_generated_output.praise_comment}
          </p>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {timeAgo(log.uploadedAt)}
        </p>
      </div>
    </div>
  );
}
