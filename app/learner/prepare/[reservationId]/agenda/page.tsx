"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface AgendaSection {
  name: string;
  nameJa: string;
  duration: number;
  startTime: string;
  endTime: string;
  goal: string;
  suggestedPhrases?: string[];
  questions?: { question: string; grammarUsed?: string; hint?: string }[];
  vocabulary?: { word: string; reading: string; meaning: string }[];
  prompts?: string[];
  note?: string;
  tips?: string;
}

interface Agenda {
  summary: {
    topic: string;
    topicJa: string;
    duration: number;
    seniorName: string;
    mainGoal: string;
  };
  sections: AgendaSection[];
  todaysGoals: string[];
  grammarFocus: {
    pattern: string;
    meaning: string;
    examplesForToday: string[];
  }[];
  usefulPhrases: {
    japanese: string;
    meaning: string;
    when: string;
  }[];
  seniorInfo: {
    name: string;
    strengths: string;
    conversationTips: string;
  };
}

export default function AgendaPage() {
  const router = useRouter();
  const params = useParams();
  const reservationId = params.reservationId as string;
  const { data: session } = useSession();

  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAgenda = async () => {
      try {
        const res = await fetch(`/api/reservations/${reservationId}`);
        if (!res.ok) throw new Error("Failed to fetch reservation");

        const data = await res.json();
        if (data.generatedAgenda) {
          setAgenda(data.generatedAgenda);
        } else {
          setError("Agenda not found. Please go back and generate one.");
        }
      } catch (err) {
        setError("Failed to load agenda");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgenda();
  }, [reservationId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your agenda...</p>
        </div>
      </div>
    );
  }

  if (error || !agenda) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white mb-8">
          <h1 className="text-2xl font-bold mb-2">Your Conversation Agenda</h1>
          <p className="opacity-90">
            {agenda.summary.topic} ({agenda.summary.topicJa})
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="bg-white/20 px-3 py-1 rounded-full">
              {agenda.summary.duration} minutes
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              with {agenda.summary.seniorName}
            </span>
          </div>
        </div>

        {/* Today's Goals */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span> Today&apos;s Goals
          </h2>
          <ul className="space-y-2">
            {agenda.todaysGoals.map((goal, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="text-orange-500 mt-1">✓</span>
                {goal}
              </li>
            ))}
          </ul>
        </div>

        {/* Conversation Flow */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span> Conversation Flow
          </h2>
          <div className="space-y-4">
            {agenda.sections.map((section, i) => (
              <div
                key={i}
                className="border-l-4 border-orange-400 pl-4 py-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    {section.nameJa} ({section.name})
                  </h3>
                  <span className="text-sm text-gray-500">
                    {section.startTime} - {section.endTime}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{section.goal}</p>

                {/* Questions */}
                {section.questions && section.questions.length > 0 && (
                  <div className="mt-3 bg-yellow-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-800 mb-2">
                      Questions to ask:
                    </p>
                    <ul className="space-y-2">
                      {section.questions.map((q, j) => (
                        <li key={j} className="text-sm text-yellow-900">
                          <span className="font-medium">{q.question}</span>
                          {q.grammarUsed && (
                            <span className="ml-2 text-xs bg-yellow-200 px-2 py-0.5 rounded">
                              {q.grammarUsed}
                            </span>
                          )}
                          {q.hint && (
                            <p className="text-xs text-yellow-700 mt-1">
                              Hint: {q.hint}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Vocabulary */}
                {section.vocabulary && section.vocabulary.length > 0 && (
                  <div className="mt-3 bg-blue-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      Vocabulary:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {section.vocabulary.map((v, j) => (
                        <span
                          key={j}
                          className="text-sm bg-blue-100 text-blue-900 px-2 py-1 rounded"
                        >
                          {v.word} ({v.reading}) - {v.meaning}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompts */}
                {section.prompts && section.prompts.length > 0 && (
                  <div className="mt-3 bg-green-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800 mb-2">
                      Things to talk about:
                    </p>
                    <ul className="space-y-1">
                      {section.prompts.map((p, j) => (
                        <li key={j} className="text-sm text-green-900">
                          • {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tips */}
                {section.tips && (
                  <p className="mt-2 text-sm text-gray-500 italic">
                    💡 {section.tips}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Grammar Focus */}
        {agenda.grammarFocus && agenda.grammarFocus.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">✏️</span> Grammar Focus
            </h2>
            <div className="space-y-4">
              {agenda.grammarFocus.map((g, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg text-orange-600">
                      {g.pattern}
                    </span>
                    <span className="text-gray-500">({g.meaning})</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Examples for today:
                  </p>
                  <ul className="space-y-1">
                    {g.examplesForToday.map((ex, j) => (
                      <li key={j} className="text-sm bg-gray-50 px-3 py-2 rounded">
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Useful Phrases */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">💬</span> Useful Phrases
          </h2>
          <div className="grid gap-3">
            {agenda.usefulPhrases.map((phrase, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900">{phrase.japanese}</p>
                <p className="text-sm text-gray-600">{phrase.meaning}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Use when: {phrase.when}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Senior Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">👤</span> About {agenda.seniorInfo.name}
          </h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <span className="font-medium">Strengths:</span>{" "}
              {agenda.seniorInfo.strengths}
            </p>
            <p>
              <span className="font-medium">Tips:</span>{" "}
              {agenda.seniorInfo.conversationTips}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
          >
            Edit Preparation
          </button>
          <button
            onClick={() => router.push(`/learner/session/${reservationId}`)}
            className="flex-1 py-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
          >
            Start Session
          </button>
        </div>
      </div>
    </div>
  );
}
