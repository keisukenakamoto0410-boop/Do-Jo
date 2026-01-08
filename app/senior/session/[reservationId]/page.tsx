"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

// Agora type definitions (for dynamic import)
type IAgoraRTCClient = any;
type ICameraVideoTrack = any;
type IMicrophoneAudioTrack = any;

// Agenda types
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

export default function SeniorSessionPage() {
  const router = useRouter();
  const params = useParams();
  const reservationId = params.reservationId as string;
  const { data: session } = useSession();

  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localTracks, setLocalTracks] = useState<{
    videoTrack: ICameraVideoTrack | null;
    audioTrack: IMicrophoneAudioTrack | null;
  }>({ videoTrack: null, audioTrack: null });

  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [reservation, setReservation] = useState<any>(null);
  const [agoraInitialized, setAgoraInitialized] = useState(false);
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showAgenda, setShowAgenda] = useState(true);

  useEffect(() => {
    fetchReservation();
  }, []);

  useEffect(() => {
    if (reservation && !agoraInitialized && !error) {
      setAgoraInitialized(true);
      initAgora();
    }
  }, [reservation, agoraInitialized, error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (client) {
        leaveChannel();
      }
    };
  }, [client]);

  // Timer
  useEffect(() => {
    if (!joined) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          handleSessionEnd();
          return 0;
        }

        if (prev === 5 * 60) {
          alert("あと5分です！");
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [joined]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`);
      if (!response.ok) {
        throw new Error("予約が見つかりませんでした");
      }
      const data = await response.json();
      setReservation(data);

      // Set agenda if available
      if (data.generatedAgenda) {
        setAgenda(data.generatedAgenda);
      }
    } catch (err) {
      console.error("Failed to fetch reservation:", err);
      setError("接続できませんでした。もう一度お試しください。");
      setLoading(false);
    }
  };

  const initAgora = async () => {
    try {
      // Check camera/microphone permissions
      try {
        const permissions = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        permissions.getTracks().forEach((track) => track.stop());
      } catch (permError) {
        throw new Error(
          "カメラとマイクの許可が必要です。アドレスバーの鍵マークをクリックして許可してください。"
        );
      }

      // Dynamic import Agora SDK
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

      // Create client
      const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      // Get token
      const response = await fetch(
        `/api/reservations/${reservationId}/agora-token`
      );

      if (!response.ok) {
        throw new Error("接続トークンを取得できませんでした");
      }

      const { token, channelName, appId, uid } = await response.json();

      // Set up remote user events
      agoraClient.on("user-published", async (user: any, mediaType: "audio" | "video") => {
        try {
          await agoraClient.subscribe(user, mediaType);

          if (mediaType === "video") {
            setTimeout(() => {
              const remoteVideoDiv = document.getElementById("remote-video");
              if (remoteVideoDiv) {
                user.videoTrack?.play("remote-video");
              }
            }, 200);
          }

          if (mediaType === "audio") {
            user.audioTrack?.play();
          }

          setRemoteUsers((prev: any[]) => {
            if (prev.find((u) => u.uid === user.uid)) return prev;
            return [...prev, user];
          });
        } catch (subErr) {
          console.error("Subscribe error:", subErr);
        }
      });

      agoraClient.on("user-unpublished", (user: any) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      agoraClient.on("user-left", (user: any) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      // Join channel
      await agoraClient.join(appId, channelName, token, uid);

      // Create local tracks
      const [audioTrack, videoTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks(
          { encoderConfig: "music_standard" },
          {
            encoderConfig: {
              width: 640,
              height: 480,
              frameRate: 15,
              bitrateMin: 600,
              bitrateMax: 1000,
            },
          }
        );

      setLocalTracks({ audioTrack, videoTrack });

      // Display local video
      const localVideoDiv = document.getElementById("local-video");
      if (!localVideoDiv) {
        throw new Error("ビデオ画面が見つかりません");
      }
      videoTrack.play("local-video");

      // Publish tracks
      await agoraClient.publish([audioTrack, videoTrack]);

      setClient(agoraClient);
      setJoined(true);
      setLoading(false);
    } catch (err) {
      console.error("Agora initialization failed:", err);
      setError(
        err instanceof Error ? err.message : "ビデオ通話を開始できませんでした"
      );
      setLoading(false);
    }
  };

  const leaveChannel = async () => {
    try {
      if (localTracks.audioTrack) {
        localTracks.audioTrack.close();
      }
      if (localTracks.videoTrack) {
        localTracks.videoTrack.close();
      }
      if (client) {
        await client.leave();
      }
    } catch (err) {
      console.error("Leave channel error:", err);
    }
  };

  const handleSessionEnd = async () => {
    await leaveChannel();

    try {
      await fetch(`/api/reservations/${reservationId}/complete`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to complete session:", err);
    }

    router.push(`/host/feedback/${reservationId}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentSection = agenda?.sections?.[currentSectionIndex];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Loading Overlay */}
      {loading && !error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center bg-white rounded-2xl p-12 max-w-md mx-4">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-sky-500 border-t-transparent mx-auto mb-6"></div>
            <p className="text-2xl font-bold text-gray-900 mb-2">接続中...</p>
            <p className="text-lg text-gray-600">
              カメラとマイクの許可を求められたら<br />
              「許可」をクリックしてください
            </p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-white rounded-2xl p-10 max-w-lg mx-4 text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              エラーが発生しました
            </h2>
            <p className="text-xl text-gray-700 mb-8">{error}</p>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setError(null);
                  setAgoraInitialized(false);
                }}
                className="w-full py-5 bg-sky-600 text-white text-xl font-bold rounded-xl hover:bg-sky-700"
              >
                もう一度試す
              </button>
              <button
                onClick={() => router.push("/senior/dashboard")}
                className="w-full py-5 bg-gray-200 text-gray-700 text-xl font-bold rounded-xl hover:bg-gray-300"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-sky-600 px-6 py-4 flex items-center justify-between">
        <div className="text-white">
          <h2 className="text-xl font-bold">ビデオ通話中</h2>
          <p className="text-sky-100">
            {reservation?.learner?.name}さんと会話中
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Toggle Agenda Button */}
          <button
            onClick={() => setShowAgenda(!showAgenda)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors"
          >
            {showAgenda ? "📋 アジェンダを隠す" : "📋 アジェンダを表示"}
          </button>

          {/* Timer */}
          <div
            className={`px-6 py-3 rounded-xl font-bold text-2xl ${
              timeLeft <= 5 * 60 ? "bg-red-500 animate-pulse text-white" : "bg-white text-sky-600"
            }`}
          >
            残り {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Section */}
        <div className={`flex-1 flex flex-col p-4 ${showAgenda ? "" : ""}`}>
          {/* Video Area - Remote video full screen, local video small */}
          <div className="flex-1 relative">
            {/* Remote Video (Full Screen) */}
            <div className="w-full h-full bg-gray-800 rounded-2xl overflow-hidden">
              <div
                id="remote-video"
                className="w-full h-full"
                style={{ minHeight: "300px" }}
              ></div>
              {remoteUsers.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900/50 rounded-2xl">
                  <div className="text-center">
                    <div className="text-5xl mb-3">👋</div>
                    <p className="text-xl font-bold">相手を待っています...</p>
                  </div>
                </div>
              )}
              {remoteUsers.length > 0 && reservation?.learner && (
                <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-lg text-white font-bold">
                  {reservation.learner.name}さん
                </div>
              )}
            </div>

            {/* Local Video (Small, bottom-right corner) */}
            <div className="absolute bottom-4 right-4 w-40 h-32 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700">
              <div
                id="local-video"
                className="w-full h-full"
              ></div>
              <div className="absolute bottom-1 left-1 bg-black/70 px-2 py-1 rounded text-white text-xs">
                あなた
              </div>
            </div>
          </div>

          {/* End Session Button */}
          <div className="mt-4">
            <button
              onClick={handleSessionEnd}
              className="w-full max-w-md mx-auto block py-4 bg-red-600 hover:bg-red-700 text-white text-xl font-bold rounded-xl transition-colors shadow-lg"
            >
              🛑 通話を終了する
            </button>
          </div>
        </div>

        {/* Agenda Panel */}
        {showAgenda && agenda && (
          <div className="w-96 bg-gray-100 border-l border-gray-300 overflow-y-auto">
            <div className="p-4">
              {/* Topic Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white mb-4">
                <p className="text-sm opacity-80">今日のトピック</p>
                <h3 className="text-xl font-bold">{agenda.summary.topicJa}</h3>
                <p className="text-sm opacity-80">{agenda.summary.topic}</p>
              </div>

              {/* Today's Goals */}
              <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span>🎯</span> 今日の目標
                </h4>
                <ul className="space-y-1">
                  {agenda.todaysGoals.map((goal, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">✓</span>
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section Navigator */}
              <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">📋 会話の流れ</h4>
                  <span className="text-sm text-gray-500">
                    {currentSectionIndex + 1} / {agenda.sections.length}
                  </span>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-1 mb-3 overflow-x-auto">
                  {agenda.sections.map((section, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSectionIndex(i)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        i === currentSectionIndex
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {section.nameJa}
                    </button>
                  ))}
                </div>

                {/* Current Section Detail */}
                {currentSection && (
                  <div className="border-l-4 border-orange-400 pl-3 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-gray-900">
                        {currentSection.nameJa}
                      </h5>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {currentSection.duration}分
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{currentSection.goal}</p>

                    {/* Questions */}
                    {currentSection.questions && currentSection.questions.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-3 mb-2">
                        <p className="text-xs font-bold text-yellow-800 mb-2">
                          💬 聞いてみましょう：
                        </p>
                        <ul className="space-y-2">
                          {currentSection.questions.map((q, j) => (
                            <li key={j} className="text-sm text-yellow-900">
                              <span className="font-medium">{q.question}</span>
                              {q.hint && (
                                <p className="text-xs text-yellow-700 mt-0.5">
                                  ヒント: {q.hint}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Prompts */}
                    {currentSection.prompts && currentSection.prompts.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-3 mb-2">
                        <p className="text-xs font-bold text-green-800 mb-2">
                          📝 話題のヒント：
                        </p>
                        <ul className="space-y-1">
                          {currentSection.prompts.map((p, j) => (
                            <li key={j} className="text-sm text-green-900">
                              • {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tips */}
                    {currentSection.tips && (
                      <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                        💡 {currentSection.tips}
                      </p>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
                    disabled={currentSectionIndex === 0}
                    className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                  >
                    ← 前へ
                  </button>
                  <button
                    onClick={() => setCurrentSectionIndex(Math.min(agenda.sections.length - 1, currentSectionIndex + 1))}
                    disabled={currentSectionIndex === agenda.sections.length - 1}
                    className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    次へ →
                  </button>
                </div>
              </div>

              {/* Grammar Focus */}
              {agenda.grammarFocus && agenda.grammarFocus.length > 0 && (
                <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>✏️</span> 今日の文法
                  </h4>
                  <div className="space-y-2">
                    {agenda.grammarFocus.map((g, i) => (
                      <div key={i} className="bg-blue-50 rounded-lg p-2">
                        <span className="font-bold text-blue-700">{g.pattern}</span>
                        <span className="text-sm text-blue-600 ml-2">({g.meaning})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learner Info */}
              {reservation?.learner && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>👤</span> 学習者情報
                  </h4>
                  <div className="text-sm space-y-1 text-gray-700">
                    <p><span className="font-medium">名前:</span> {reservation.learner.name}</p>
                    {reservation.learner.country && (
                      <p><span className="font-medium">出身:</span> {reservation.learner.country}</p>
                    )}
                    {reservation.learner.jlptLevel && (
                      <p><span className="font-medium">レベル:</span> {reservation.learner.jlptLevel}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Agenda Message */}
        {showAgenda && !agenda && (
          <div className="w-96 bg-gray-100 border-l border-gray-300 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-600">
                アジェンダがありません<br />
                学習者がまだ準備していないようです
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
