"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

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
  const [isMuted, setIsMuted] = useState(true); // Default muted
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  const videoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
    if (reservation && !joined) {
      initAgora();
    }
  }, [reservation]);

  // Cleanup
  useEffect(() => {
    return () => {
      leaveChannel();
    };
  }, [client]);

  const fetchReservation = async () => {
    try {
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

      // Get token
      const tokenRes = await fetch(`/api/agora/token?channelName=${reservationId}`);
      if (!tokenRes.ok) throw new Error("Failed to get token");
      const { token, appId } = await tokenRes.json();

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
            if (container) {
              user.videoTrack?.play(container);
            }
          }, 100);
        }

        if (mediaType === "audio") {
          user.audioTrack?.play();
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

      // Join channel (no video, no audio by default)
      await agoraClient.join(appId, reservationId, token, `admin-${session?.user?.id}`);
      setJoined(true);
      setLoading(false);

      console.log("Admin joined in stealth mode");
    } catch (err) {
      console.error("Agora init error:", err);
      setError("接続に失敗しました");
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

    // TODO: Implement session end API
    alert("セッション終了機能は開発中です");
  };

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
          <Link href="/admin/reservations" className="text-blue-400 hover:underline">
            予約管理に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
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

            <div className="flex items-center gap-2">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {remoteUsers.length === 0 ? (
            <div className="col-span-2 bg-gray-800 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">⏳</div>
              <p className="text-white text-xl">参加者を待っています...</p>
              <p className="text-gray-400 mt-2">
                {joined ? "チャンネルに接続済み" : "接続中..."}
              </p>
            </div>
          ) : (
            remoteUsers.map((user, index) => (
              <div key={user.uid} className="relative bg-gray-800 rounded-xl overflow-hidden">
                <div
                  ref={el => { videoRefs.current[user.uid] = el; }}
                  className="w-full aspect-video bg-gray-900"
                ></div>
                <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 rounded-full text-white text-sm">
                  {index === 0 ? "参加者 1" : "参加者 2"} (ID: {String(user.uid).slice(0, 8)})
                </div>
                {!user.videoTrack && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-gray-400">カメラオフ</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Emergency Controls */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            緊急コントロール
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Emergency Voice */}
            {!isEmergencyMode ? (
              <button
                onClick={enableEmergencyMode}
                className="px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors"
              >
                <div className="text-2xl mb-1">🎤</div>
                緊急発言モード
                <p className="text-xs font-normal opacity-75 mt-1">
                  クリックで音声を有効化
                </p>
              </button>
            ) : (
              <button
                onClick={toggleMute}
                className={`px-6 py-4 font-bold rounded-xl transition-colors ${
                  isMuted
                    ? "bg-gray-600 hover:bg-gray-500 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                }`}
              >
                <div className="text-2xl mb-1">{isMuted ? "🔇" : "🔊"}</div>
                {isMuted ? "ミュート中" : "発言中"}
                <p className="text-xs font-normal opacity-75 mt-1">
                  クリックで切り替え
                </p>
              </button>
            )}

            {/* End Session */}
            <button
              onClick={handleEndSession}
              className="px-6 py-4 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl transition-colors"
            >
              <div className="text-2xl mb-1">🛑</div>
              セッション終了
              <p className="text-xs font-normal opacity-75 mt-1">
                全員を切断
              </p>
            </button>

            {/* Leave */}
            <button
              onClick={() => {
                leaveChannel();
                router.push("/admin/reservations");
              }}
              className="px-6 py-4 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-xl transition-colors"
            >
              <div className="text-2xl mb-1">🚪</div>
              退出
              <p className="text-xs font-normal opacity-75 mt-1">
                モニタリング終了
              </p>
            </button>
          </div>
        </div>

        {/* Session Info */}
        {reservation && (
          <div className="mt-6 bg-gray-800 rounded-xl p-6">
            <h2 className="text-white font-bold mb-4">セッション情報</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">ホスト</p>
                <p className="text-white">{reservation.host?.name}</p>
                <p className="text-gray-500">{reservation.host?.email}</p>
              </div>
              <div>
                <p className="text-gray-400">学習者</p>
                <p className="text-white">{reservation.learner?.name}</p>
                <p className="text-gray-500">{reservation.learner?.email}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
