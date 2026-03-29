"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getSupabase } from "@/lib/supabase";

// Agora型定義（動的インポート用）
type IAgoraRTCClient = any;
type ICameraVideoTrack = any;
type IMicrophoneAudioTrack = any;

// エンゲージメント計測定数
const SPEAK_THRESHOLD = 15; // Agoraのlevelは0〜100スケール
const INTERVAL_SEC = 0.2;   // 200ms = 0.2秒

export default function HostSessionPage() {
  const router = useRouter();
  const params = useParams();
  const reservationId = params.reservationId as string;
  const { data: session } = useSession();

  console.log("HostSessionPage loaded");
  console.log("Reservation ID:", reservationId);

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
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [advisorData, setAdvisorData] = useState<{
    summary: string;
    improvements: string[];
    topics: string[];
    questions: string[];
  } | null>(null);
  const [advisorLoading, setAdvisorLoading] = useState(true);

  // エンゲージメント計測用ref
  const speakDataRef = useRef({
    foreignerCount: 0,
    seniorCount: 0,
    totalCount: 0,
  });

  useEffect(() => {
    console.log("Component mounted");
    fetchReservation();
  }, []);

  useEffect(() => {
    if (reservation && !agoraInitialized && !error) {
      console.log("Ready to initialize Agora");
      setAgoraInitialized(true);
      initAgora();
    }
  }, [reservation, agoraInitialized, error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (client) {
        console.log("Cleanup: leaving channel");
        leaveChannel();
      }
    };
  }, [client]);

  // タイマー
  useEffect(() => {
    if (!joined) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          handleSessionEnd();
          return 0;
        }

        if (prev === 5 * 60) {
          alert("5 minutes remaining!");
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [joined]);

  // AI面談アドバイザーデータ取得
  useEffect(() => {
    if (reservation) {
      fetchAdvisorData();
    }
  }, [reservation]);

  const fetchAdvisorData = async () => {
    try {
      setAdvisorLoading(true);
      const response = await fetch(`/api/reservations/${reservationId}/advisor`);
      if (response.ok) {
        const data = await response.json();
        setAdvisorData(data);
      }
    } catch (error) {
      console.error("Failed to fetch advisor data:", error);
    } finally {
      setAdvisorLoading(false);
    }
  };

  const fetchReservation = async () => {
    try {
      console.log("Fetching reservation:", reservationId);
      const response = await fetch(`/api/reservations/${reservationId}`);
      if (!response.ok) {
        throw new Error("Reservation not found");
      }
      const data = await response.json();
      console.log("Reservation loaded:", data);

      // Check if session time has started (allow 5 minutes early)
      const sessionStart = new Date(data.slot.startTime);
      const now = new Date();
      const fiveMinutesBefore = new Date(sessionStart.getTime() - 5 * 60 * 1000);
      const sessionEnd = new Date(sessionStart.getTime() + 30 * 60 * 1000); // 30 min after start

      if (now < fiveMinutesBefore) {
        const waitMinutes = Math.ceil((fiveMinutesBefore.getTime() - now.getTime()) / 60000);
        setError(`Session has not started yet. Please come back in ${waitMinutes} minutes. You can join 5 minutes before the session starts at ${sessionStart.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}.`);
        setLoading(false);
        return;
      }

      if (now > sessionEnd) {
        setError("This session has already ended.");
        setLoading(false);
        return;
      }

      setReservation(data);
    } catch (err) {
      console.error("Failed to fetch reservation:", err);
      setError("Failed to load session. Please try again.");
      setLoading(false);
    }
  };

  const initAgora = async () => {
    try {
      console.log("=".repeat(50));
      console.log("STEP 1: Starting Agora initialization (Host)");
      console.log("=".repeat(50));

      // カメラ・マイクの権限を先に確認
      console.log("Checking camera/microphone permissions...");

      try {
        const permissions = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        console.log("Permissions granted!");
        console.log("Video tracks:", permissions.getVideoTracks().length);
        console.log("Audio tracks:", permissions.getAudioTracks().length);

        // 一旦停止（Agoraが再度取得するため）
        permissions.getTracks().forEach((track) => track.stop());
      } catch (permError) {
        console.error("Permission denied:", permError);
        throw new Error(
          "Camera/Microphone permission denied. Please click the lock icon in the address bar and allow access."
        );
      }

      // Agora SDK動的インポート
      console.log("Importing Agora SDK...");
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      console.log("Agora SDK loaded");

      // クライアント作成
      console.log("Creating Agora client...");
      const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      console.log("Agora client created");

      // トークン取得
      console.log("Fetching Agora token...");
      const response = await fetch(
        `/api/reservations/${reservationId}/agora-token`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Token fetch failed:", response.status, errorText);
        throw new Error("Failed to get Agora token");
      }

      const { token, channelName, appId, uid } = await response.json();
      console.log("Token received:");
      console.log("  - App ID:", appId);
      console.log("  - Channel:", channelName);
      console.log("  - UID:", uid);

      // リモートユーザーイベントを設定（参加前に設定）
      agoraClient.on("user-published", async (user: any, mediaType: "audio" | "video") => {
        console.log("Learner published:", user.uid, mediaType);

        try {
          await agoraClient.subscribe(user, mediaType);
          console.log("Subscribed to:", user.uid);

          if (mediaType === "video") {
            console.log("Playing learner video...");
            setTimeout(() => {
              const remoteVideoDiv = document.getElementById("remote-video");
              if (remoteVideoDiv) {
                user.videoTrack?.play("remote-video");
                console.log("Learner video playing");
              } else {
                console.error("remote-video div not found!");
              }
            }, 200);
          }

          if (mediaType === "audio") {
            console.log("Playing learner audio...");
            user.audioTrack?.play();
            console.log("Learner audio playing");
          }

          setRemoteUsers((prev: any[]) => {
            if (prev.find((u) => u.uid === user.uid)) return prev;
            return [...prev, user];
          });
        } catch (subErr) {
          console.error("Subscribe error:", subErr);
        }
      });

      agoraClient.on("user-unpublished", (user: any, mediaType: "audio" | "video") => {
        console.log("Learner unpublished:", user.uid, mediaType);
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      agoraClient.on("user-left", (user: any) => {
        console.log("Learner left:", user.uid);
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      // チャンネルに参加
      console.log("Joining channel...");
      await agoraClient.join(appId, channelName, token, uid);
      console.log("Joined channel successfully!");

      // 発話量の取得を開始
      agoraClient.enableAudioVolumeIndicator();

      agoraClient.on("volume-indicator", (volumes: any) => {
        volumes.forEach(({ uid: volumeUid, level }: { uid: number; level: number }) => {
          if (volumeUid === 0 && level >= SPEAK_THRESHOLD) {
            // uid === 0 はローカルユーザー（ホスト/シニア）
            speakDataRef.current.seniorCount++;
          } else if (volumeUid !== 0 && level >= SPEAK_THRESHOLD) {
            // uid !== 0 はリモートユーザー（学習者/外国人）
            speakDataRef.current.foreignerCount++;
          }
        });
        speakDataRef.current.totalCount++;
      });

      // ローカルトラック作成
      console.log("Creating local tracks...");
      const [audioTrack, videoTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks(
          {
            encoderConfig: "speech_standard",  // 会話向け（低ビットレート）
          },
          {
            encoderConfig: {
              width: 360,
              height: 360,
              frameRate: 15,
              bitrateMin: 200,
              bitrateMax: 500,
            },
            optimizationMode: "motion",  // 会話向け（動きを優先、低遅延）
          }
        );

      // ネットワーク品質監視を有効化
      agoraClient.enableDualStream();  // 低品質ストリームを自動切り替え

      console.log("Local tracks created");
      console.log("  - Video:", videoTrack.getMediaStreamTrack().label);
      console.log("  - Audio:", audioTrack.getMediaStreamTrack().label);

      setLocalTracks({ audioTrack, videoTrack });

      // ローカルビデオを表示
      console.log("Playing local video...");
      const localVideoDiv = document.getElementById("local-video");

      if (!localVideoDiv) {
        console.error("local-video div not found!");
        throw new Error("Video container not found");
      }

      console.log("Found local-video div");
      videoTrack.play("local-video", { mirror: false });
      console.log("Local video is now playing");

      // トラックを公開
      console.log("Publishing tracks to channel...");
      await agoraClient.publish([audioTrack, videoTrack]);
      console.log("Tracks published!");

      // クライアントをstateに保存
      setClient(agoraClient);
      setJoined(true);
      setLoading(false);

      console.log("=".repeat(50));
      console.log("Agora initialization complete!");
      console.log("=".repeat(50));
    } catch (err) {
      console.error("=".repeat(50));
      console.error("AGORA INITIALIZATION FAILED");
      console.error("=".repeat(50));
      console.error("Error:", err);
      console.error("Stack:", err instanceof Error ? err.stack : "N/A");

      setError(
        err instanceof Error ? err.message : "Failed to start video call"
      );
      setLoading(false);
    }
  };

  const leaveChannel = async () => {
    try {
      console.log("Leaving channel...");

      if (localTracks.audioTrack) {
        localTracks.audioTrack.close();
        console.log("Audio track closed");
      }
      if (localTracks.videoTrack) {
        localTracks.videoTrack.close();
        console.log("Video track closed");
      }

      if (client) {
        await client.leave();
        console.log("Left channel");
      }
    } catch (err) {
      console.error("Leave channel error:", err);
    }
  };

  const saveEngagement = async () => {
    const d = speakDataRef.current;
    const toSec = (n: number) => Math.round(n * INTERVAL_SEC);

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("engagement_logs")
        .insert({
          session_id: reservationId,
          foreigner_speak_sec: toSec(d.foreignerCount),
          senior_speak_sec: toSec(d.seniorCount),
          silence_sec:
            toSec(d.totalCount) -
            toSec(d.foreignerCount) -
            toSec(d.seniorCount),
        });

      if (error) console.error("engagement保存失敗", error);
    } catch (err) {
      console.error("engagement保存エラー", err);
    }
  };

  const handleSessionEnd = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to end this session?\n\nセッションを終了してもよろしいですか？"
    );
    if (!confirmed) return;

    await saveEngagement();
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

  const toggleMute = () => {
    if (localTracks.audioTrack) {
      localTracks.audioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localTracks.videoTrack) {
      localTracks.videoTrack.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative">
      {/* Loading Overlay */}
      {loading && !error && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-xl">Connecting to session...</p>
            <p className="text-gray-400 text-sm mt-2">
              Please allow camera and microphone access
            </p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="max-w-md bg-white rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Camera/Microphone Error
            </h2>
            <p className="text-gray-700 mb-6">{error}</p>

            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6 text-left">
              <p className="font-bold text-blue-900 mb-2">How to fix:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Click the lock icon in the address bar</li>
                <li>Set Camera and Microphone to &quot;Allow&quot;</li>
                <li>Reload this page</li>
              </ol>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setError(null);
                  setAgoraInitialized(false);
                }}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                onClick={() => router.push("/host/dashboard")}
                className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="text-white">
          <h2 className="text-xl font-bold">Video Session (Host)</h2>
          <p className="text-sm text-gray-400">
            {loading ? "Connecting..." : joined ? "Connected" : "Ready"}
          </p>
        </div>

        {/* Timer */}
        <div
          className={`px-6 py-3 rounded-lg font-bold text-2xl ${
            timeLeft <= 5 * 60 ? "bg-red-500 animate-pulse" : "bg-[#FF6B35]"
          } text-white`}
        >
          {formatTime(timeLeft)}
        </div>

        <button
          onClick={handleSessionEnd}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
        >
          End Session
        </button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        {/* Local Video (Host) */}
        <div className="relative bg-gray-800 rounded-xl overflow-hidden">
          <div
            id="local-video"
            className="w-full h-full"
            style={{ minHeight: "400px" }}
          ></div>
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">Camera Off</div>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded text-white text-sm font-medium">
            You (Host) {joined && "(Connected)"} {isMuted && "(Muted)"}
          </div>
        </div>

        {/* Remote Video (Learner) */}
        <div className="relative bg-gray-800 rounded-xl overflow-hidden">
          <div
            id="remote-video"
            className="w-full h-full"
            style={{ minHeight: "400px" }}
          ></div>
          {remoteUsers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900/50">
              <div className="text-center">
                <div className="text-6xl mb-4">Waiting</div>
                <p className="text-xl font-medium">Waiting for learner...</p>
                <p className="text-sm text-gray-400 mt-2">
                  {joined ? "Connected to channel" : "Connecting..."}
                </p>
              </div>
            </div>
          )}
          {remoteUsers.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded text-white text-sm font-medium">
              Learner (Connected)
            </div>
          )}
        </div>
      </div>

      {/* 会話のヒント（左側） */}
      <div className="absolute top-20 left-4 bg-gray-800/95 rounded-xl p-4 text-white w-72 max-h-[70vh] overflow-y-auto hidden lg:block">
        <h3 className="font-bold mb-3 text-lg flex items-center gap-2">
          💡 会話のヒント
        </h3>
        <div className="space-y-4 text-sm">
          {/* 最初の挨拶 */}
          <div>
            <p className="text-blue-400 font-medium mb-2">■ 最初の挨拶</p>
            <ul className="text-gray-300 space-y-1 ml-2">
              <li>・はじめまして！よろしくお願いします。</li>
              <li>・今日はどこから参加していますか？</li>
            </ul>
          </div>

          {/* 簡単な質問 */}
          <div>
            <p className="text-green-400 font-medium mb-2">■ 簡単な質問</p>
            <ul className="text-gray-300 space-y-1 ml-2">
              <li>・お名前は何ですか？</li>
              <li>・お仕事は何をしていますか？</li>
              <li>・日本語を勉強して何年ですか？</li>
            </ul>
          </div>

          {/* 日本について */}
          <div>
            <p className="text-yellow-400 font-medium mb-2">■ 日本について</p>
            <ul className="text-gray-300 space-y-1 ml-2">
              <li>・日本に来たことはありますか？</li>
              <li>・日本の食べ物で好きなものは？</li>
              <li>・日本のどこに行きたいですか？</li>
            </ul>
          </div>

          {/* 相手の国について */}
          <div>
            <p className="text-purple-400 font-medium mb-2">■ 相手の国について</p>
            <ul className="text-gray-300 space-y-1 ml-2">
              <li>・お国の有名な食べ物は何ですか？</li>
              <li>・今の季節はどうですか？</li>
              <li>・休みの日は何をしますか？</li>
            </ul>
          </div>

          {/* 沈黙した時 */}
          <div>
            <p className="text-red-400 font-medium mb-2">■ 沈黙した時</p>
            <ul className="text-gray-300 space-y-1 ml-2">
              <li>・週末は何をしましたか？</li>
              <li>・最近、面白かったことはありますか？</li>
              <li>・何か質問はありますか？</li>
            </ul>
          </div>

          {/* ポジティブな反応 */}
          <div>
            <p className="text-pink-400 font-medium mb-2">■ ポジティブな反応</p>
            <ul className="text-gray-300 space-y-1 ml-2">
              <li>・すごいですね！</li>
              <li>・いいですね〜！</li>
              <li>・上手ですよ！</li>
              <li>・分かります、分かります。</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center space-x-4">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition-colors ${
            isMuted
              ? "bg-red-600 text-white"
              : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-colors ${
            isVideoOff
              ? "bg-red-600 text-white"
              : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
          title={isVideoOff ? "Turn on camera" : "Turn off camera"}
        >
          {isVideoOff ? "Camera On" : "Camera Off"}
        </button>

        <button
          onClick={handleSessionEnd}
          className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          title="End call"
        >
          End Call
        </button>
      </div>

      {/* Session Info & Learner Topic */}
      {reservation && (
        <div className="absolute top-20 right-4 bg-gray-800 rounded-xl p-4 text-white w-72 hidden lg:block max-h-[40vh] overflow-y-auto">
          <h3 className="font-bold mb-3 text-lg">📋 セッション情報</h3>
          <div className="text-sm space-y-3">
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">学習者</p>
              <p className="font-medium text-lg">{reservation.learner?.name}</p>
              {reservation.learner?.country && (
                <p className="text-gray-400 text-xs">{reservation.learner.country}</p>
              )}
            </div>

            {reservation.selectedTopic && (
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-400 text-xs mb-1">🎯 今日のトピック</p>
                <p className="font-medium">{reservation.selectedTopic}</p>
              </div>
            )}

            {reservation.conversationGoal && (
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                <p className="text-green-400 text-xs mb-1">🎯 会話の目標</p>
                <p className="font-medium">{reservation.conversationGoal}</p>
              </div>
            )}

            {reservation.grammarToStudy && reservation.grammarToStudy.length > 0 && (
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
                <p className="text-purple-400 text-xs mb-1">📝 練習したい文法</p>
                <div className="flex flex-wrap gap-1">
                  {reservation.grammarToStudy.map((g: string, i: number) => (
                    <span key={i} className="bg-purple-600/50 px-2 py-0.5 rounded text-xs">{g}</span>
                  ))}
                </div>
              </div>
            )}

            {reservation.additionalNotes && (
              <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-400 text-xs mb-1">💬 メモ</p>
                <p className="text-sm">{reservation.additionalNotes}</p>
              </div>
            )}

            <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
              <p>タイプ: {reservation.sessionType === "casual" ? "カジュアル" : "ビジネス"}</p>
              <p>時間: 25分</p>
            </div>
          </div>
        </div>
      )}

      {/* AI面談アドバイザーパネル */}
      <div className="absolute bottom-24 right-4 w-80 max-h-[calc(100vh-200px)] bg-gray-800/95 rounded-xl p-4 text-white overflow-y-auto hidden lg:block">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🤖</span>
          <h3 className="font-bold text-lg">AI面談アドバイザー</h3>
        </div>

        {advisorLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">分析中...</p>
          </div>
        ) : advisorData ? (
          <div className="space-y-4 text-sm">
            {/* 学習者情報 */}
            <div>
              <p className="text-gray-400 text-xs mb-1">学習者</p>
              <p className="font-medium">{reservation?.learner?.name}</p>
              <p className="text-gray-400 text-xs">
                {reservation?.learner?.jlptLevel && `${reservation.learner.jlptLevel}`}
                {reservation?.learner?.learningGoal && ` | ${reservation.learner.learningGoal}`}
              </p>
            </div>

            {/* 学習内容の要約 */}
            <div>
              <p className="text-blue-400 font-medium mb-1">📚 最近の学習内容</p>
              <p className="text-gray-300">{advisorData.summary}</p>
            </div>

            {/* 改善ポイント */}
            <div>
              <p className="text-yellow-400 font-medium mb-1">💡 改善ポイント</p>
              <ul className="text-gray-300 space-y-1">
                {advisorData.improvements.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>

            {/* おすすめトピック */}
            <div>
              <p className="text-green-400 font-medium mb-1">💬 話すと良いトピック</p>
              <ul className="text-gray-300 space-y-1">
                {advisorData.topics.map((topic, i) => (
                  <li key={i}>• {topic}</li>
                ))}
              </ul>
            </div>

            {/* 質問例 */}
            <div>
              <p className="text-purple-400 font-medium mb-1">❓ 質問例</p>
              <ul className="text-gray-300 space-y-1">
                {advisorData.questions.map((q, i) => (
                  <li key={i} className="bg-gray-700/50 p-2 rounded text-xs">&quot;{q}&quot;</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">アドバイスを取得できませんでした</p>
            <button
              onClick={fetchAdvisorData}
              className="mt-2 px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-700"
            >
              再試行
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
