"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface Reservation {
  id: string;
  slot: {
    startTime: string;
    endTime: string;
  };
  host: {
    id: string;
    name: string;
    avatar: string | null;
  };
  generatedAgenda: Agenda | null;
}

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
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeUntilStart, setTimeUntilStart] = useState<number>(0);
  const [canJoin, setCanJoin] = useState(false);

  useEffect(() => {
    const fetchAgenda = async () => {
      try {
        const res = await fetch(`/api/reservations/${reservationId}`);
        if (!res.ok) throw new Error("Failed to fetch reservation");

        const data = await res.json();
        setReservation(data);
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

  // Timer to check if user can join
  useEffect(() => {
    if (!reservation?.slot?.startTime) return;

    const updateTimer = () => {
      const now = new Date();
      const start = new Date(reservation.slot.startTime);
      const diff = start.getTime() - now.getTime();
      const minutesUntil = Math.ceil(diff / 60000);

      setTimeUntilStart(minutesUntil);
      setCanJoin(minutesUntil <= 5); // Can join 5 minutes before
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [reservation?.slot?.startTime]);

  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatSessionTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/learner/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>
          <span className="text-sm text-gray-500">Conversation Agenda</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
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

        {/* Session Ready Card */}
        {reservation && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">✅</span>
              <h2 className="text-2xl font-bold">Preparation Complete!</h2>
            </div>

            {/* Session Info */}
            <div className="bg-white/20 rounded-xl p-4 mb-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="text-sm opacity-80">Date & Time</p>
                    <p className="font-bold">
                      {formatSessionDate(reservation.slot.startTime)} at{" "}
                      {formatSessionTime(reservation.slot.startTime)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">👤</span>
                  <div>
                    <p className="text-sm opacity-80">Partner</p>
                    <p className="font-bold">{reservation.host?.name || agenda?.summary.seniorName}-san</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">📝</span>
                  <div>
                    <p className="text-sm opacity-80">Topic</p>
                    <p className="font-bold">{agenda?.summary.topic}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Until Start */}
            {timeUntilStart > 5 ? (
              <div className="bg-white/20 rounded-xl p-4 text-center">
                <p className="text-lg mb-2">Session starts in</p>
                <p className="text-4xl font-bold">
                  {timeUntilStart > 60
                    ? `${Math.floor(timeUntilStart / 60)}h ${timeUntilStart % 60}m`
                    : `${timeUntilStart} minutes`}
                </p>
                <p className="text-sm opacity-80 mt-2">
                  You can join 5 minutes before the session starts
                </p>
              </div>
            ) : canJoin ? (
              <div className="bg-white/20 rounded-xl p-4 text-center">
                <p className="text-xl font-bold animate-pulse">
                  🟢 Ready to join now!
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex-1 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
          >
            Edit Preparation
          </button>
          {canJoin ? (
            <button
              onClick={() => router.push(`/learner/session/${reservationId}`)}
              className="flex-1 py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors shadow-lg"
            >
              Join Session Now
            </button>
          ) : (
            <button
              disabled
              className="flex-1 py-4 bg-gray-300 text-gray-500 font-semibold rounded-xl cursor-not-allowed"
            >
              Join Session (Not yet)
            </button>
          )}
        </div>

        {/* Tips Section */}
        <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">💡</span> Tips for your session
          </h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-green-500">✓</span>
              Find a quiet place with good lighting
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500">✓</span>
              Test your camera and microphone
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500">✓</span>
              Review your conversation agenda above
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500">✓</span>
              Prepare a notebook to write new words
            </li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
}
