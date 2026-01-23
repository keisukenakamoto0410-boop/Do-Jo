"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSlideSync } from "@/hooks/useSlideSync";
import { TOPICS } from "@/components/video/TopicSelector";

// SlideViewerを動的インポート（SSR無効）
const SlideViewer = dynamic(() => import("@/components/video/SlideViewer"), {
  ssr: false,
});

// Admin emails
const ADMIN_EMAILS = ["keisuke.mjugaad91@gmail.com"];

// Agora types
type IAgoraRTCClient = any;
type IMicrophoneAudioTrack = any;

interface RemoteUser {
  uid: string | number;
  videoTrack?: any;
  audioTrack?: any;
}

export default function AdminWatchPage() {
  const router = useRouter();
  const params = useParams();
  const reservationId = params.reservationId as string;
  const { data: session, status } = useSession();

  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [reservation, setReservation] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [agoraInitialized, setAgoraInitialized] = useState(false);

  // スライド関連
  const [showSlides, setShowSlides] = useState(false);

  const videoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // スライド同期フック（管理者は読み取り専用）
  const { currentSlide, slideTopic } = useSlideSync({
    reservationId,
    isHost: true, // 読み取り専用
    initialTopic: reservation?.slideTopic,
  });

  // Auth check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.email && !ADMIN_EMAILS.includes(session.user.email)) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
      fetchReservation();
    }
  }, [session]);

  useEffect(() => {
    if (reservation && !agoraInitialized && !error) {
      setAgoraInitialized(true);
      initAgora();
    }
  }, [reservation, agoraInitialized, error]);

  // Cleanup
  useEffect(() => {
    return () => {
      leaveChannel();
    };
  }, [client]);

  const fetchReservation = async () => {
    try {
      console.log("Fetching reservation:", reservationId);
      const response = await fetch(`/api/reservations/${reservationId}`);
      if (!response.ok) throw new Error("Reservation not found");
      const data = await response.json();
      setReservation(data);
    } catch (err) {
      console.error("Failed to fetch reservation:", err);
      setError("セッション情報の取得に失敗しました");
      setLoading(false);
    }
  };

  const initAgora = async () => {
    try {
      setLoading(true);

      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(agoraClient);

      // 同じAPIエンドポイントを使用（管理者用の特別なUID）
      const response = await fetch(
        `/api/reservations/${reservationId}/agora-token?role=admin`
      );

      if (!response.ok) {
        throw new Error("接続トークンを取得できませんでした");
      }

      const { token, channelName, appId, uid } = await response.json();

      // Event handlers
      agoraClient.on("user-published", async (user: any, mediaType: "audio" | "video") => {
        console.log("Admin: User published:", user.uid, mediaType);
        await agoraClient.subscribe(user, mediaType);

        setRemoteUsers(prev => {
          const exists = prev.find(u => u.uid === user.uid);
          if (exists) {
            return prev.map(u => u.uid === user.uid ? { ...u, [mediaType + "Track"]: user[mediaType + "Track"] } : u);
          }
          return [...prev, { uid: user.uid, [mediaType + "Track"]: user[mediaType + "Track"] }];
        });

        if (mediaType === "video") {
          setTimeout(() => {
            const container = videoRefs.current[user.uid];
            if (container && user.videoTrack) {
              try {
                user.videoTrack.play(container);
                console.log("[Admin] Remote video playing for uid:", user.uid);
              } catch (playErr) {
                console.error("[Admin] Video play error:", playErr);
              }
            }
          }, 100);
        }

        if (mediaType === "audio") {
          if (user.audioTrack) {
            user.audioTrack.play();
          }
        }
      });

      agoraClient.on("user-unpublished", (user: any, mediaType: "audio" | "video") => {
        console.log("Admin: User unpublished:", user.uid, mediaType);
        if (mediaType === "video") {
          setRemoteUsers(prev => prev.map(u =>
            u.uid === user.uid ? { ...u, videoTrack: undefined } : u
          ));
        }
      });

      agoraClient.on("user-left", (user: any) => {
        console.log("Admin: User left:", user.uid);
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      // Join channel with admin UID
      await agoraClient.join(appId, channelName, token, uid || `admin-${session?.user?.id}`);
      setJoined(true);
      setLoading(false);

      console.log("Admin joined in stealth mode");
    } catch (err) {
      console.error("Agora init error:", err);
      setError("接続に失敗しました: " + (err instanceof Error ? err.message : "不明なエラー"));
      setLoading(false);
    }
  };

  const enableEmergencyMode = async () => {
    if (!client) return;

    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

      // Create and publish audio track
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalAudioTrack(audioTrack);
      await client.publish([audioTrack]);

      setIsMuted(false);
      setIsEmergencyMode(true);

      console.log("Emergency mode enabled - admin can now speak");
    } catch (err) {
      console.error("Failed to enable emergency mode:", err);
      alert("緊急モードの有効化に失敗しました");
    }
  };

  const toggleMute = async () => {
    if (!localAudioTrack) return;

    if (isMuted) {
      await localAudioTrack.setEnabled(true);
      setIsMuted(false);
    } else {
      await localAudioTrack.setEnabled(false);
      setIsMuted(true);
    }
  };

  const leaveChannel = async () => {
    if (localAudioTrack) {
      localAudioTrack.close();
      setLocalAudioTrack(null);
    }
    if (client) {
      await client.leave();
    }
    setJoined(false);
    setRemoteUsers([]);
  };

  const handleEndSession = async () => {
    if (!confirm("セッションを強制終了しますか？参加者全員が切断されます。")) return;

    try {
      await fetch(`/api/reservations/${reservationId}/complete`, {
        method: "POST",
      });
      alert("セッションを終了しました");
      router.push("/admin/reservations");
    } catch (err) {
      console.error("Failed to end session:", err);
      alert("セッション終了に失敗しました");
    }
  };

  // トピック情報を取得
  const topicInfo = slideTopic
    ? TOPICS.find((t) => t.id === slideTopic)
    : null;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">接続中...</p>
        </div>
      </div>
    );
  }

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <div className="space-y-4">
            <button
              onClick={() => {
                setError(null);
                setAgoraInitialized(false);
              }}
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              もう一度試す
            </button>
            <Link href="/admin/reservations" className="block text-blue-400 hover:underline">
              予約管理に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/reservations" className="text-gray-400 hover:text-white">
              ← 戻る
            </Link>
            <div>
              <h1 className="text-white font-bold flex items-center gap-2">
                <span className="text-yellow-500">👁</span>
                管理者モニタリング
              </h1>
              <p className="text-gray-400 text-sm">
                {reservation?.host?.name} × {reservation?.learner?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Topic Display */}
            {topicInfo && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                <span>{topicInfo.emoji}</span>
                <span className="text-white text-sm">{topicInfo.nameJa}</span>
              </div>
            )}

            {/* Slide Toggle */}
            {slideTopic && (
              <button
                onClick={() => setShowSlides(!showSlides)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showSlides
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {showSlides ? "スライド非表示" : "スライド表示"}
              </button>
            )}

            {/* Status Badge */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isEmergencyMode
                ? "bg-red-500 text-white animate-pulse"
                : "bg-green-500/20 text-green-400"
            }`}>
              {isEmergencyMode ? "緊急モード" : "ステルスモード"}
            </span>

            {/* Connected Users */}
            <span className="px-3 py-1 bg-gray-700 rounded-full text-white text-sm">
              参加者: {remoteUsers.length}人
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Slide Viewer (背景) */}
        {showSlides && slideTopic && (
          <div className="absolute inset-0 p-4 z-0">
            <SlideViewer
              topic={slideTopic}
              isHost={true}
              reservationId={reservationId}
              currentSlide={currentSlide}
            />
          </div>
        )}

        {/* Video Grid */}
        <div className={`p-4 ${showSlides ? "absolute top-4 right-4 z-10 w-80" : ""}`}>
          <div className={`grid ${showSlides ? "grid-cols-1 gap-2" : "grid-cols-1 md:grid-cols-2 gap-4"}`}>
            {remoteUsers.length === 0 ? (
              <div className={`${showSlides ? "" : "col-span-2"} bg-gray-800 rounded-xl p-12 text-center`}>
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-white text-xl">参加者を待っています...</p>
                <p className="text-gray-400 mt-2">
                  {joined ? "チャンネルに接続済み" : "接続中..."}
                </p>
              </div>
            ) : (
              remoteUsers.map((user, index) => (
                <div key={user.uid} className={`relative bg-gray-800 rounded-xl overflow-hidden ${showSlides ? "h-32" : ""}`}>
                  <div
                    ref={el => { videoRefs.current[user.uid] = el; }}
                    className={`w-full ${showSlides ? "h-32" : "aspect-video"} bg-gray-900`}
                  ></div>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
                    {index === 0 ? (reservation?.host?.name || "ホスト") : (reservation?.learner?.name || "学習者")}
                  </div>
                  {!user.videoTrack && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <div className="text-center">
                        <div className="text-2xl mb-1">📷</div>
                        <p className="text-gray-400 text-xs">カメラオフ</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Emergency Controls */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 ${showSlides ? "z-20" : ""}`}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-white font-bold mb-3 flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              緊急コントロール
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {/* Emergency Voice */}
              {!isEmergencyMode ? (
                <button
                  onClick={enableEmergencyMode}
                  className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors"
                >
                  <div className="text-xl mb-1">🎤</div>
                  緊急発言モード
                </button>
              ) : (
                <button
                  onClick={toggleMute}
                  className={`px-4 py-3 font-bold rounded-xl transition-colors ${
                    isMuted
                      ? "bg-gray-600 hover:bg-gray-500 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                  }`}
                >
                  <div className="text-xl mb-1">{isMuted ? "🔇" : "🔊"}</div>
                  {isMuted ? "ミュート中" : "発言中"}
                </button>
              )}

              {/* End Session */}
              <button
                onClick={handleEndSession}
                className="px-4 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl transition-colors"
              >
                <div className="text-xl mb-1">🛑</div>
                セッション終了
              </button>

              {/* Leave */}
              <button
                onClick={() => {
                  leaveChannel();
                  router.push("/admin/reservations");
                }}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-xl transition-colors"
              >
                <div className="text-xl mb-1">🚪</div>
                退出
              </button>
            </div>
          </div>
        </div>

        {/* Session Info */}
        {reservation && !showSlides && (
          <div className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gray-800/90 rounded-xl p-4">
            <h2 className="text-white font-bold mb-3">セッション情報</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">ホスト</p>
                <p className="text-white">{reservation.host?.name}</p>
              </div>
              <div>
                <p className="text-gray-400">学習者</p>
                <p className="text-white">{reservation.learner?.name}</p>
              </div>
              {reservation.slideTopic && (
                <div className="col-span-2">
                  <p className="text-gray-400">トピック</p>
                  <p className="text-white">{topicInfo?.nameJa || reservation.slideTopic}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
