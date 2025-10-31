"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "../ui/Button";

interface NextInterviewCardProps {
  interview: {
    id: string;
    scheduledAt: string;
    interviewer: {
      name: string;
      expertise?: string[];
    };
    jobCategory?: string;
  } | null;
}

export default function NextInterviewCard({ interview }: NextInterviewCardProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!interview) return;

    const calculateTimeLeft = () => {
      const difference = new Date(interview.scheduledAt).getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [interview]);

  if (!interview) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          次の面接予約はありません
        </h3>
        <p className="text-gray-600 mb-6">
          今すぐ面接を予約して、日本語スキルを向上させましょう！
        </p>
        <Link href="/candidate/book">
          <Button variant="primary" size="lg" leftIcon={<span>📅</span>}>
            面接を予約する
          </Button>
        </Link>
      </div>
    );
  }

  const interviewDate = new Date(interview.scheduledAt);
  const formattedDate = interviewDate.toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const formattedTime = interviewDate.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-purple-100 text-sm font-medium">次の面接</p>
          <h3 className="text-2xl font-bold mt-1">
            {formattedDate} {formattedTime}
          </h3>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      {/* Interview Details */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-purple-100 text-xs mb-1">面接官</p>
            <p className="font-medium">{interview.interviewer.name}</p>
          </div>
          {interview.jobCategory && (
            <div>
              <p className="text-purple-100 text-xs mb-1">カテゴリー</p>
              <p className="font-medium">{interview.jobCategory}</p>
            </div>
          )}
        </div>
      </div>

      {/* Countdown Timer */}
      {timeLeft && (
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
          <p className="text-center text-purple-100 text-xs mb-2">開始まで</p>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className="text-2xl font-bold">{timeLeft.days}</div>
              <div className="text-xs text-purple-100">日</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, "0")}</div>
              <div className="text-xs text-purple-100">時間</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, "0")}</div>
              <div className="text-xs text-purple-100">分</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, "0")}</div>
              <div className="text-xs text-purple-100">秒</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <Link href={`/candidate/interview/${interview.id}`}>
        <button className="w-full bg-white text-purple-600 py-3 rounded-lg hover:bg-purple-50 transition-colors font-semibold">
          面接詳細を見る →
        </button>
      </Link>
    </div>
  );
}
