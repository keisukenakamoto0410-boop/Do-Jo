"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import SlideToggleButton from "@/components/video/SlideToggleButton";
import TargetWordsBar from "@/components/video/TargetWordsBar";
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

export default function SessionPage() {
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

  // スライド関連の状態
  const [showSlides, setShowSlides] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // メダル関連の状態
  const [earnedMedals, setEarnedMedals] = useState<string[]>([]);
  const [showMedalModal, setShowMedalModal] = useState(false);

  // タイマー開始フラグ
  const [timerStarted, setTimerStarted] = useState(false);

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

  // Timer - 両者入室後に開始
  useEffect(() => {
    if (!timerStarted) return;

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
  }, [timerStarted]);

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

          // まず状態を更新してDOMを準備
          setRemoteUsers((prev: any[]) => {
            if (prev.find((u) => u.uid === user.uid)) return prev;
            return [...prev, user];
          });

          if (mediaType === "video" && user.videoTrack) {
            // DOMの準備を待ってからビデオを再生
            const playVideo = () => {
              const remoteVideoDiv = document.getElementById("remote-video");
              if (remoteVideoDiv) {
                console.log("[Agora] Playing remote video");
                user.videoTrack.play("remote-video");
              } else {
                console.log("[Agora] remote-video element not found, retrying...");
                setTimeout(playVideo, 100);
              }
            };
            setTimeout(playVideo, 300);
          }

          if (mediaType === "audio" && user.audioTrack) {
            console.log("[Agora] Playing remote audio");
            user.audioTrack.play();
          }
        } catch (subErr) {
          console.error("[Agora] Subscribe error:", subErr);
        }
      });

      agoraClient.on("user-unpublished", (user: any) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
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

      const localVideoDiv = document.getElementById("local-video");
      if (!localVideoDiv) {
        throw new Error("Video container not found");
      }
      videoTrack.play("local-video");

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
          return; // モーダル表示後に遷移
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

  // レイアウト判定
  const renderLayout = () => {
    if (!showSlides || !slideTopic) {
      // スライド非表示：顔だけ全画面
      return (
        <div className="flex-1 relative p-4">
          <div className="w-full h-full bg-gray-800 rounded-xl overflow-hidden">
            <div
              id="remote-video"
              className="w-full h-full"
              style={{ minHeight: "400px" }}
            ></div>
            {remoteUsers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900/50 m-4 rounded-xl">
                <div className="text-center">
                  <div className="text-6xl mb-4">👋</div>
                  <p className="text-xl font-medium">Waiting for host...</p>
                  {!partnerJoined && (
                    <p className="text-gray-400 mt-2">The host hasn&apos;t joined yet</p>
                  )}
                </div>
              </div>
            )}
            {/* セッション開始通知 */}
            {sessionStarted && !timerStarted && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/90 m-4 rounded-xl z-10">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">🎉</div>
                  <p className="text-2xl font-bold">Session Started!</p>
                  <p className="mt-2">Let&apos;s have a great conversation!</p>
                </div>
              </div>
            )}
            {remoteUsers.length > 0 && (
              <div className="absolute bottom-8 left-8 bg-black/70 px-4 py-2 rounded-lg text-white font-medium">
                {reservation?.host?.name || "Host"}
              </div>
            )}
          </div>

          {/* Local Video (Small, bottom-right corner) */}
          <div className="absolute bottom-8 right-8 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700">
            <div id="local-video" className="w-full h-full"></div>
            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
              You
            </div>
          </div>
        </div>
      );
    }

    // スマホ縦向き：全画面トグル
    if (isMobile && !isLandscape) {
      return (
        <div className="flex-1 relative">
          <div className="w-full h-full">
            <SlideViewer
              topic={slideTopic}
              isHost={false}
              reservationId={reservationId}
              currentSlide={currentSlide}
              onSlideChange={changeSlide}
            />
          </div>
          {/* 小さい顔表示 */}
          <div className="absolute top-4 right-4 w-24 h-20 bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-600">
            <div id="remote-video" className="w-full h-full"></div>
          </div>
          <div className="absolute top-28 right-4 w-20 h-16 bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-600">
            <div id="local-video" className="w-full h-full"></div>
          </div>
        </div>
      );
    }

    // スマホ横向き：顔20% / スライド80%
    if (isMobile && isLandscape) {
      return (
        <div className="flex-1 flex">
          <div className="w-1/5 flex flex-col gap-2 p-2">
            <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
              <div id="remote-video" className="w-full h-full"></div>
            </div>
            <div className="h-20 bg-gray-800 rounded-lg overflow-hidden">
              <div id="local-video" className="w-full h-full"></div>
            </div>
          </div>
          <div className="w-4/5 p-2">
            <SlideViewer
              topic={slideTopic}
              isHost={false}
              reservationId={reservationId}
              currentSlide={currentSlide}
              onSlideChange={changeSlide}
            />
          </div>
        </div>
      );
    }

    // PC：Google Meet風（スライド85% / 顔15%右上）
    return (
      <div className="flex-1 relative p-4">
        <div className="w-full h-full">
          <SlideViewer
            topic={slideTopic}
            isHost={false}
            reservationId={reservationId}
            currentSlide={currentSlide}
            onSlideChange={changeSlide}
          />
        </div>
        {/* 顔は右上に小さく（ピクチャーインピクチャー風） */}
        <div className="absolute top-6 right-6 w-48 flex flex-col gap-2">
          <div className="h-36 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-600">
            <div id="remote-video" className="w-full h-full"></div>
            {remoteUsers.length > 0 && (
              <div className="absolute bottom-1 left-1 bg-black/70 px-2 py-0.5 rounded text-white text-xs">
                {reservation?.host?.name}
              </div>
            )}
          </div>
          <div className="h-28 bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-600">
            <div id="local-video" className="w-full h-full"></div>
            <div className="absolute bottom-1 left-1 bg-black/70 px-2 py-0.5 rounded text-white text-xs">
              You
            </div>
          </div>
        </div>
      </div>
    );
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
      <div className="bg-gray-800 p-4 flex items-center justify-between">
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

      {/* Video/Slide Area */}
      {renderLayout()}

      {/* Target Words Bar */}
      {reservation?.targetWords && reservation.targetWords.length > 0 && (
        <TargetWordsBar
          targetWords={reservation.targetWords}
          conversationGoal={reservation.conversationGoal}
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
