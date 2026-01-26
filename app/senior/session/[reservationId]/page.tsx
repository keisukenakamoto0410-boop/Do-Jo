"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import SlideToggleButton from "@/components/video/SlideToggleButton";
import SupportHints from "@/components/video/SupportHints";
import SessionChat from "@/components/video/SessionChat";
import { useSlideSync } from "@/hooks/useSlideSync";
import { useSessionJoin } from "@/hooks/useSessionJoin";
import { TOPICS } from "@/components/video/TopicSelector";

// SlideViewerを動的インポート（SSR無効）
const SlideViewer = dynamic(() => import("@/components/video/SlideViewer"), {
  ssr: false,
});

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

  // Video refs - 一つだけ使用
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

  // スライド関連の状態
  const [showSlides, setShowSlides] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // タイマー開始フラグ
  const [timerStarted, setTimerStarted] = useState(false);

  // ビデオ表示モード（cover: アップ表示, contain: 全体表示）
  const [videoFit, setVideoFit] = useState<"cover" | "contain">("cover");

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

  // スライド同期フック（シニアはisHost=trueで受信のみ）
  const { currentSlide, slideTopic } = useSlideSync({
    reservationId,
    isHost: true,
    initialTopic: reservation?.slideTopic,
  });

  // 画面サイズ検出
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
      const response = await fetch(`/api/reservations/${reservationId}`);
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

      const response = await fetch(
        `/api/reservations/${reservationId}/agora-token`
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

      // Play local video using ref
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
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

  // トピック情報を取得
  const topicInfo = slideTopic
    ? TOPICS.find((t) => t.id === slideTopic)
    : null;

  // レイアウトに応じたビデオコンテナのスタイル
  const getVideoContainerStyle = () => {
    if (!showSlides || !slideTopic) {
      // スライド非表示：フルスクリーン
      return {
        remote: "absolute inset-4 rounded-2xl overflow-hidden bg-gray-800",
        local: "absolute bottom-8 right-8 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 bg-gray-800 z-20",
      };
    }

    if (isMobile && !isLandscape) {
      // スマホ縦向き
      return {
        remote: "absolute top-4 right-4 w-24 h-20 rounded-lg overflow-hidden shadow-xl border border-gray-600 bg-gray-800 z-20",
        local: "absolute top-28 right-4 w-20 h-16 rounded-lg overflow-hidden shadow-xl border border-gray-600 bg-gray-800 z-20",
      };
    }

    if (isMobile && isLandscape) {
      // スマホ横向き
      return {
        remote: "absolute left-2 top-2 w-[18%] h-[calc(100%-100px)] rounded-lg overflow-hidden bg-gray-800 z-20",
        local: "absolute left-2 bottom-2 w-[18%] h-20 rounded-lg overflow-hidden bg-gray-800 z-20",
      };
    }

    // PC
    return {
      remote: "absolute top-6 right-6 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-600 bg-gray-800 z-20",
      local: "absolute top-48 right-6 w-48 h-28 rounded-xl overflow-hidden shadow-xl border border-gray-600 bg-gray-800 z-20",
    };
  };

  const videoStyles = getVideoContainerStyle();

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
      <div className="bg-sky-600 px-6 py-4 flex items-center justify-between z-30">
        <div className="text-white">
          <h2 className="text-xl font-bold">ビデオ通話中</h2>
          <p className="text-sky-100">
            {reservation?.learner?.name}さんと会話中
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* スライドトグルボタン */}
          {slideTopic && (
            <SlideToggleButton
              isOpen={showSlides}
              onToggle={() => setShowSlides(!showSlides)}
              language="ja"
            />
          )}

          {/* トピック表示 */}
          {topicInfo && (
            <div className="hidden md:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
              <span>{topicInfo.emoji}</span>
              <span className="text-white text-sm">{topicInfo.nameJa}</span>
            </div>
          )}

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
        {/* Slide Viewer (背景) */}
        {showSlides && slideTopic && (
          <div className="absolute inset-0 p-4">
            <SlideViewer
              topic={slideTopic}
              isHost={true}
              reservationId={reservationId}
              currentSlide={currentSlide}
            />
          </div>
        )}

        {/* Remote Video - 常に同じ要素、スタイルだけ変更 */}
        <div className={videoStyles.remote}>
          <div
            ref={remoteVideoRef}
            className={`w-full h-full ${videoFit === "contain" ? "video-contain" : "video-cover"}`}
            style={{ minHeight: !showSlides ? "400px" : undefined }}
          />
          {remoteUsers.length === 0 && !showSlides && (
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
          {remoteUsers.length > 0 && !showSlides && reservation?.learner && (
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

        {/* Local Video - 常に同じ要素、スタイルだけ変更 */}
        <div className={videoStyles.local}>
          <div ref={localVideoRef} className="w-full h-full" />
          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-sm">
            あなた
          </div>
        </div>
      </div>

      {/* Support Hints for Target Words */}
      {reservation?.targetWords && reservation.targetWords.length > 0 && (
        <SupportHints
          targetWords={reservation.targetWords}
          learnerName={reservation.learner?.name}
        />
      )}

      {/* Session Chat */}
      {session?.user?.id && (
        <SessionChat
          reservationId={reservationId}
          currentUserId={session.user.id}
          language="ja"
        />
      )}
    </div>
  );
}
