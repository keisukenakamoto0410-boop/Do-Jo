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
    id: "hospital",
    emoji: "🏥",
    nameEn: "Hospital & Pharmacy",
    nameJa: "病院・薬局",
    description: "Symptoms, medications, medical consultations",
  },
  {
    id: "government",
    emoji: "🏢",
    nameEn: "Government Procedures",
    nameJa: "役所手続き",
    description: "Residence card, insurance, taxes, documents",
  },
  {
    id: "shopping",
    emoji: "🏪",
    nameEn: "Shopping & Supermarket",
    nameJa: "買い物・スーパー",
    description: "Prices, products, payment methods",
  },
  {
    id: "transportation",
    emoji: "🚇",
    nameEn: "Transportation",
    nameJa: "交通機関",
    description: "Trains, buses, taxis, tickets",
  },
  {
    id: "neighborhood",
    emoji: "🏡",
    nameEn: "Neighborhood Relations",
    nameJa: "近所付き合い",
    description: "Greetings, garbage sorting, community events",
  },
  {
    id: "childcare",
    emoji: "👶",
    nameEn: "Childcare & School",
    nameJa: "育児・学校",
    description: "Kindergarten, school events, activities",
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
