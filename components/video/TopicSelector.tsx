"use client";

import { useState } from "react";

export interface Topic {
  id: string;
  emoji: string;
  nameEn: string;
  nameJa: string;
  description: string;
}

export const TOPICS: Topic[] = [
  {
    id: "food",
    emoji: "🍣",
    nameEn: "Food Culture",
    nameJa: "食文化",
    description: "Japanese cuisine, cooking, restaurants",
  },
  {
    id: "japanese-culture",
    emoji: "🎌",
    nameEn: "Japanese Culture",
    nameJa: "日本文化",
    description: "Traditions, festivals, customs",
  },
  {
    id: "travel",
    emoji: "🗻",
    nameEn: "Travel",
    nameJa: "旅行",
    description: "Places to visit, sightseeing, transportation",
  },
  {
    id: "daily-life",
    emoji: "🏠",
    nameEn: "Daily Life",
    nameJa: "日常生活",
    description: "Shopping, routines, living in Japan",
  },
  {
    id: "hobbies",
    emoji: "🎮",
    nameEn: "Hobbies",
    nameJa: "趣味",
    description: "Games, sports, entertainment",
  },
  {
    id: "work",
    emoji: "💼",
    nameEn: "Work",
    nameJa: "仕事",
    description: "Business, careers, workplace culture",
  },
];

interface TopicSelectorProps {
  selectedTopic: string | null;
  onSelect: (topicId: string) => void;
  language?: "en" | "ja";
}

export default function TopicSelector({
  selectedTopic,
  onSelect,
  language = "en",
}: TopicSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {TOPICS.map((topic) => (
        <button
          key={topic.id}
          type="button"
          onClick={() => onSelect(topic.id)}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            selectedTopic === topic.id
              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
          }`}
        >
          <div className="text-3xl mb-2">{topic.emoji}</div>
          <div className="font-semibold text-gray-900">
            {language === "en" ? topic.nameEn : topic.nameJa}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {topic.description}
          </div>
          {selectedTopic === topic.id && (
            <div className="mt-2 text-blue-600 text-xs font-medium">
              ✓ {language === "en" ? "Selected" : "選択中"}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
