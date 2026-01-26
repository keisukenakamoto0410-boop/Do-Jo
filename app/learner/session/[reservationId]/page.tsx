"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import SlideToggleButton from "@/components/video/SlideToggleButton";
import TargetWordsBar from "@/components/video/TargetWordsBar";
import SessionChat from "@/components/video/SessionChat";
import { useSlideSync } from "@/hooks/useSlideSync";
import { useSessionJoin } from "@/hooks/useSessionJoin";
import { TOPICS } from "@/components/video/TopicSelector";
import { NewMedalsModal } from "@/components/MedalDisplay";

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

export default function SessionPage() {
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

  // メダル関連の状態
  const [earnedMedals, setEarnedMedals] = useState<string[]>([]);
  const [showMedalModal, setShowMedalModal] = useState(false);

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
    isHost: false,
    onBothJoined: () => {
      setTimerStarted(true);
    },
  });

  // スライド同期フック
  const { currentSlide, slideTopic, changeSlide } = useSlideSync({
    reservationId,
    isHost: false,
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
          alert("5 minutes remaining!");
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStarted, sessionStartedAt]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`);
      if (!response.ok) {
        throw new Error("Reservation not found");
      }
      const data = await response.json();

      if (!data.generatedAgenda) {
        router.push(`/learner/prepare/${reservationId}`);
        return;
      }

      const sessionStart = new Date(data.slot.startTime);
      const now = new Date();
      const fiveMinutesBefore = new Date(sessionStart.getTime() - 5 * 60 * 1000);
      const sessionEnd = new Date(sessionStart.getTime() + 30 * 60 * 1000);

      if (now < fiveMinutesBefore) {
        const waitMinutes = Math.ceil((fiveMinutesBefore.getTime() - now.getTime()) / 60000);
        setError(`Session has not started yet. Please come back in ${waitMinutes} minutes.`);
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
      try {
        const permissions = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        permissions.getTracks().forEach((track) => track.stop());
      } catch (permError) {
        throw new Error(
          "Camera/Microphone permission denied. Please allow access."
        );
      }

      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      const response = await fetch(
        `/api/reservations/${reservationId}/agora-token`
      );

      if (!response.ok) {
        throw new Error("Failed to get Agora token");
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
                // Update existing user with new video track
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
        err instanceof Error ? err.message : "Failed to start video call"
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
      const res = await fetch(`/api/reservations/${reservationId}/complete`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.earnedMedals && data.earnedMedals.length > 0) {
          setEarnedMedals(data.earnedMedals);
          setShowMedalModal(true);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to complete session:", err);
    }

    router.push(`/learner/feedback/${reservationId}`);
  };

  const handleMedalModalClose = () => {
    setShowMedalModal(false);
    router.push(`/learner/feedback/${reservationId}`);
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
        remote: "absolute inset-4 rounded-xl overflow-hidden bg-gray-800",
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
              Connection Error
            </h2>
            <p className="text-gray-700 mb-6">{error}</p>

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
                onClick={() => router.push("/learner/dashboard")}
                className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between z-30">
        <div className="text-white">
          <h2 className="text-xl font-bold">Video Session</h2>
          <p className="text-sm text-gray-400">
            {loading ? "Connecting..." : joined ? "Connected" : "Ready"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* スライドトグルボタン */}
          {slideTopic && (
            <SlideToggleButton
              isOpen={showSlides}
              onToggle={() => setShowSlides(!showSlides)}
              language="en"
            />
          )}

          {/* トピック表示 */}
          {topicInfo && (
            <div className="hidden md:flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-lg">
              <span>{topicInfo.emoji}</span>
              <span className="text-white text-sm">{topicInfo.nameEn}</span>
            </div>
          )}

          {/* Timer / Waiting Status */}
          {timerStarted ? (
            <div
              className={`px-6 py-3 rounded-lg font-bold text-2xl ${
                timeLeft <= 5 * 60 ? "bg-red-500" : "bg-green-500"
              } text-white`}
            >
              {formatTime(timeLeft)}
            </div>
          ) : (
            <div className="px-4 py-2 rounded-lg bg-yellow-500 text-white font-medium flex items-center gap-2">
              <div className="animate-pulse w-2 h-2 bg-white rounded-full"></div>
              {partnerJoined ? "Starting..." : "Waiting for host..."}
            </div>
          )}

          <button
            onClick={handleSessionEnd}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
          >
            End Session
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
              isHost={false}
              reservationId={reservationId}
              currentSlide={currentSlide}
              onSlideChange={changeSlide}
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
                <p className="text-xl font-medium">Waiting for host...</p>
                {!partnerJoined && (
                  <p className="text-gray-400 mt-2">The host hasn&apos;t joined yet</p>
                )}
              </div>
            </div>
          )}
          {remoteUsers.length > 0 && !showSlides && (
            <>
              <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-lg text-white font-medium">
                {reservation?.host?.name || "Host"}
              </div>
              {/* ビデオ表示切り替えボタン */}
              <button
                onClick={() => setVideoFit(prev => prev === "cover" ? "contain" : "cover")}
                className="absolute top-4 left-4 bg-gray-800/70 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                {videoFit === "cover" ? "📹 Full View" : "📹 Close-up"}
              </button>
            </>
          )}
        </div>

        {/* Local Video - 常に同じ要素、スタイルだけ変更 */}
        <div className={videoStyles.local}>
          <div ref={localVideoRef} className="w-full h-full" />
          <div className="absolute bottom-1 left-1 bg-black/70 px-2 py-0.5 rounded text-white text-xs">
            You
          </div>
        </div>
      </div>

      {/* Target Words Bar */}
      {reservation?.targetWords && reservation.targetWords.length > 0 && (
        <TargetWordsBar
          targetWords={reservation.targetWords}
          conversationGoal={reservation.conversationGoal}
          language="en"
        />
      )}

      {/* Session Chat */}
      {session?.user?.id && (
        <SessionChat
          reservationId={reservationId}
          currentUserId={session.user.id}
          language="en"
        />
      )}

      {/* Medal Modal */}
      {showMedalModal && (
        <NewMedalsModal
          medals={earnedMedals}
          onClose={handleMedalModalClose}
        />
      )}
    </div>
  );
}
