"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import SupportHints from "@/components/video/SupportHints";
import SessionChat from "@/components/video/SessionChat";
import { useSessionJoin } from "@/hooks/useSessionJoin";

// Agora type definitions (for dynamic import)
type IAgoraRTCClient = any;
type ICameraVideoTrack = any;
type IMicrophoneAudioTrack = any;

// 残り時間を計算する関数
const calculateRemainingTime = (sessionStartedAt: Date | null) => {
  if (!sessionStartedAt) return 25 * 60;
  const elapsed = Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 1000);
  return Math.max(0, 25 * 60 - elapsed);
};

export default function SeniorSessionPage() {
  const router = useRouter();
  const params = useParams();
  const reservationId = params.reservationId as string;
  const { data: session } = useSession();

  // Support token-based authentication from URL parameter
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const token = searchParams?.get('token');

  // Video refs
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);

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

  // タイマー開始フラグ
  const [timerStarted, setTimerStarted] = useState(false);

  // ビデオ表示モード（cover: アップ表示, contain: 全体表示）
  const [videoFit, setVideoFit] = useState<"cover" | "contain">("contain");

  // モバイル横画面警告
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);

  // 画面の向きを検出
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isLandscape = window.innerWidth > window.innerHeight;
      setShowOrientationWarning(isMobile && isLandscape);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // セッション入室管理フック
  const {
    partnerJoined,
    sessionStarted,
    sessionStartedAt,
    isLoading: joinLoading,
  } = useSessionJoin({
    reservationId,
    isHost: true,
    onBothJoined: () => {
      setTimerStarted(true);
    },
  });

  useEffect(() => {
    fetchReservation();
  }, []);

  useEffect(() => {
    if (reservation && !agoraInitialized && !error) {
      setAgoraInitialized(true);
      initAgora();
    }
  }, [reservation, agoraInitialized, error]);

  useEffect(() => {
    return () => {
      if (client) {
        leaveChannel();
      }
    };
  }, [client]);

  // sessionStartedAt が取得できたら残り時間を計算
  useEffect(() => {
    if (sessionStartedAt) {
      const remaining = calculateRemainingTime(sessionStartedAt);
      setTimeLeft(remaining);
      setTimerStarted(true);
    }
  }, [sessionStartedAt]);

  // Timer - 両者入室後に開始（sessionStartedAt基準で計算）
  useEffect(() => {
    if (!timerStarted) return;

    const interval = setInterval(() => {
      if (sessionStartedAt) {
        const remaining = calculateRemainingTime(sessionStartedAt);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          handleSessionEnd();
        }

        if (remaining === 5 * 60) {
          alert("あと5分です！");
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStarted, sessionStartedAt]);

  const fetchReservation = async () => {
    try {
      // Get token from sessionStorage if available (for LINE users)
      const sessionToken = typeof window !== 'undefined' ? sessionStorage.getItem('sessionToken') : null;

      const headers: HeadersInit = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(`/api/reservations/${reservationId}`, { headers });
      if (!response.ok) {
        throw new Error("予約が見つかりませんでした");
      }
      const data = await response.json();

      const sessionStart = new Date(data.slot.startTime);
      const now = new Date();
      const fiveMinutesBefore = new Date(sessionStart.getTime() - 5 * 60 * 1000);
      const sessionEnd = new Date(sessionStart.getTime() + 30 * 60 * 1000);

      if (now < fiveMinutesBefore) {
        const waitMinutes = Math.ceil((fiveMinutesBefore.getTime() - now.getTime()) / 60000);
        const startTimeStr = sessionStart.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
        setError(`セッションはまだ始まっていません。あと${waitMinutes}分後にお越しください。開始時刻: ${startTimeStr}`);
        setLoading(false);
        return;
      }

      if (now > sessionEnd) {
        setError("このセッションはすでに終了しています。");
        setLoading(false);
        return;
      }

      setReservation(data);
    } catch (err) {
      console.error("Failed to fetch reservation:", err);
      setError("接続できませんでした。もう一度お試しください。");
      setLoading(false);
    }
  };

  const initAgora = async () => {
    try {
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

      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      // Get token from sessionStorage if available (for LINE users)
      const sessionToken = typeof window !== 'undefined' ? sessionStorage.getItem('sessionToken') : null;

      const headers: HeadersInit = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(
        `/api/reservations/${reservationId}/agora-token`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("接続トークンを取得できませんでした");
      }

      const { token, channelName, appId, uid } = await response.json();

      agoraClient.on("user-published", async (user: any, mediaType: "audio" | "video") => {
        try {
          console.log(`[Agora] user-published: uid=${user.uid}, mediaType=${mediaType}`);
          await agoraClient.subscribe(user, mediaType);
          console.log(`[Agora] subscribed to ${mediaType}`);

          if (mediaType === "video") {
            setRemoteUsers((prev: any[]) => {
              const existing = prev.find((u) => u.uid === user.uid);
              if (existing) {
                return prev.map((u) => u.uid === user.uid ? user : u);
              }
              return [...prev, user];
            });

            // 相手が入室したらタイマー開始
            setTimerStarted(true);

            // Play video using ref
            setTimeout(() => {
              if (remoteVideoRef.current && user.videoTrack) {
                try {
                  user.videoTrack.play(remoteVideoRef.current);
                  console.log("[Agora] Remote video playing via ref");
                } catch (playErr) {
                  console.error("[Agora] Video play error:", playErr);
                }
              }
            }, 100);
          }

          if (mediaType === "audio") {
            const track = user.audioTrack;
            if (track) {
              console.log("[Agora] Playing remote audio");
              track.play();
            }
          }
        } catch (subErr) {
          console.error("[Agora] Subscribe error:", subErr);
        }
      });

      agoraClient.on("user-unpublished", (user: any, mediaType: "audio" | "video") => {
        if (mediaType === "video") {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        }
      });

      agoraClient.on("user-left", (user: any) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      await agoraClient.join(appId, channelName, token, uid);

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

      setLocalTracks({ audioTrack, videoTrack });

      // Play local video using ref (mirror: false to disable horizontal flip)
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current, { mirror: false });
      }

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
    // Show confirmation dialog
    const confirmed = window.confirm(
      "通話を終了してもよろしいですか？\n\nAre you sure you want to end this session?"
    );
    if (!confirmed) return;

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

  // ビデオコンテナのスタイル（シンプル化）
  const videoStyles = {
    remote: "absolute inset-4 rounded-2xl overflow-hidden bg-gray-800",
    local: "absolute bottom-8 right-8 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 bg-gray-800 z-20",
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* モバイル横画面警告 */}
      {showOrientationWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90">
          <div className="text-center p-8">
            <div className="text-6xl mb-6 animate-bounce">📱</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              スマホを縦向きにしてください
            </h2>
            <p className="text-gray-300 text-lg mb-4">
              ビデオ通話は<span className="text-sky-400 font-bold">縦画面</span>での<br />
              ご利用をおすすめします
            </p>
            <div className="flex items-center justify-center gap-4 text-4xl">
              <span className="transform rotate-90">📱</span>
              <span className="text-white">→</span>
              <span>📱</span>
            </div>
          </div>
        </div>
      )}

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
      <div className="bg-sky-600 px-6 py-4 flex items-center justify-between z-30">
        <div className="text-white">
          <h2 className="text-xl font-bold">ビデオ通話中</h2>
          <p className="text-sky-100">
            {reservation?.learner?.name}さんと会話中
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer / Waiting Status */}
          {timerStarted ? (
            <div
              className={`px-6 py-3 rounded-xl font-bold text-2xl ${
                timeLeft <= 5 * 60 ? "bg-red-500 animate-pulse text-white" : "bg-white text-sky-600"
              }`}
            >
              残り {formatTime(timeLeft)}
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-yellow-500 text-white font-bold flex items-center gap-2">
              <div className="animate-pulse w-3 h-3 bg-white rounded-full"></div>
              {partnerJoined ? "開始中..." : "相手を待っています..."}
            </div>
          )}

          {/* End Session Button */}
          <button
            onClick={handleSessionEnd}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
          >
            通話を終了
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {/* Remote Video */}
        <div className={videoStyles.remote}>
          <div
            ref={remoteVideoRef}
            className={`w-full h-full ${videoFit === "contain" ? "video-contain" : "video-cover"}`}
            style={{ minHeight: "400px" }}
          />
          {remoteUsers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900/50">
              <div className="text-center">
                <div className="text-6xl mb-4">👋</div>
                <p className="text-2xl font-bold">相手を待っています...</p>
                {!partnerJoined && (
                  <p className="text-gray-400 mt-2">学習者がまだ入室していません</p>
                )}
              </div>
            </div>
          )}
          {remoteUsers.length > 0 && reservation?.learner && (
            <>
              <div className="absolute bottom-6 left-6 bg-black/70 px-4 py-2 rounded-lg text-white font-bold text-lg">
                {reservation.learner.name}さん
              </div>
              {/* ビデオ表示切り替えボタン */}
              <button
                onClick={() => setVideoFit(prev => prev === "cover" ? "contain" : "cover")}
                className="absolute top-4 left-4 bg-gray-800/70 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                {videoFit === "cover" ? "📹 全体表示" : "📹 アップ表示"}
              </button>
            </>
          )}
        </div>

        {/* Local Video */}
        <div className={videoStyles.local}>
          <div ref={localVideoRef} className="w-full h-full" />
          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-sm">
            あなた
          </div>
        </div>
      </div>

      {/* Support Hints for Topic, Goal, and Target Words */}
      {reservation && (
        <SupportHints
          targetWords={reservation.targetWords}
          selectedTopic={reservation.selectedTopic}
          conversationGoal={reservation.conversationGoal}
          learnerName={reservation.learner?.name}
        />
      )}

      {/* Session Chat */}
      {(session?.user?.id || (typeof window !== 'undefined' && sessionStorage.getItem('sessionUserId'))) && (
        <SessionChat
          reservationId={reservationId}
          currentUserId={session?.user?.id || (typeof window !== 'undefined' ? sessionStorage.getItem('sessionUserId') || '' : '')}
          language="ja"
        />
      )}
    </div>
  );
}
