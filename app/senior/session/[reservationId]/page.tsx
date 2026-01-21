"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import SlideToggleButton from "@/components/video/SlideToggleButton";
import SupportHints from "@/components/video/SupportHints";
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

  // スライド関連の状態
  const [showSlides, setShowSlides] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

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
          alert("あと5分です！");
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
          console.log(`[Agora] Subscribed to ${mediaType} for uid=${user.uid}`);

          // First update React state to prepare DOM
          setRemoteUsers((prev: any[]) => {
            if (prev.find((u) => u.uid === user.uid)) return prev;
            return [...prev, user];
          });

          if (mediaType === "video" && user.videoTrack) {
            // Wait for DOM to be ready, then play video with retry mechanism
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
        throw new Error("ビデオ画面が見つかりません");
      }
      videoTrack.play("local-video");

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

  // レイアウト描画
  const renderLayout = () => {
    if (!showSlides || !slideTopic) {
      // スライドなし：相手の顔を大きく、自分は右下に小さく
      return (
        <div className="flex-1 relative p-4">
          <div className="w-full h-full bg-gray-800 rounded-2xl overflow-hidden">
            <div
              id="remote-video"
              className="w-full h-full"
              style={{ minHeight: "400px" }}
            ></div>
            {remoteUsers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900/50 m-4 rounded-2xl">
                <div className="text-center">
                  <div className="text-6xl mb-4">👋</div>
                  <p className="text-2xl font-bold">相手を待っています...</p>
                  {!partnerJoined && (
                    <p className="text-gray-400 mt-2">学習者がまだ入室していません</p>
                  )}
                </div>
              </div>
            )}
            {/* セッション開始通知 */}
            {sessionStarted && !timerStarted && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/90 m-4 rounded-2xl z-10">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">🎉</div>
                  <p className="text-2xl font-bold">会話スタート！</p>
                  <p className="mt-2">楽しい会話をしましょう！</p>
                </div>
              </div>
            )}
            {remoteUsers.length > 0 && reservation?.learner && (
              <div className="absolute bottom-6 left-6 bg-black/70 px-4 py-2 rounded-lg text-white font-bold text-lg">
                {reservation.learner.name}さん
              </div>
            )}
          </div>

          {/* Local Video (Small, bottom-right corner) */}
          <div className="absolute bottom-8 right-8 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700">
            <div id="local-video" className="w-full h-full"></div>
            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-sm">
              あなた
            </div>
          </div>
        </div>
      );
    }

    // スマホ縦向き：スライドメイン、顔は小さく
    if (isMobile && !isLandscape) {
      return (
        <div className="flex-1 relative">
          <div className="w-full h-full">
            <SlideViewer
              topic={slideTopic}
              isHost={true}
              reservationId={reservationId}
              currentSlide={currentSlide}
            />
          </div>
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
              isHost={true}
              reservationId={reservationId}
              currentSlide={currentSlide}
            />
          </div>
        </div>
      );
    }

    // PC：スライドメイン、顔は右上にPIP
    return (
      <div className="flex-1 relative p-4">
        <div className="w-full h-full">
          <SlideViewer
            topic={slideTopic}
            isHost={true}
            reservationId={reservationId}
            currentSlide={currentSlide}
          />
        </div>
        {/* 顔は右上にPIP */}
        <div className="absolute top-6 right-6 w-48 flex flex-col gap-2">
          <div className="h-36 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-600">
            <div id="remote-video" className="w-full h-full"></div>
            {remoteUsers.length > 0 && (
              <div className="absolute bottom-1 left-1 bg-black/70 px-2 py-0.5 rounded text-white text-xs">
                {reservation?.learner?.name}
              </div>
            )}
          </div>
          <div className="h-28 bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-600">
            <div id="local-video" className="w-full h-full"></div>
            <div className="absolute bottom-1 left-1 bg-black/70 px-2 py-0.5 rounded text-white text-xs">
              あなた
            </div>
          </div>
        </div>
      </div>
    );
  };

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

      {/* Main Content - Video/Slide Area */}
      {renderLayout()}

      {/* Support Hints for Target Words */}
      {reservation?.targetWords && reservation.targetWords.length > 0 && (
        <SupportHints
          targetWords={reservation.targetWords}
          learnerName={reservation.learner?.name}
        />
      )}
    </div>
  );
}
