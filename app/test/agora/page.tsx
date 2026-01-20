"use client";

import { useState, useEffect, useRef } from "react";

// Agora types
type IAgoraRTCClient = any;
type ICameraVideoTrack = any;
type IMicrophoneAudioTrack = any;
type IAgoraRTCRemoteUser = any;

export default function AgoraTestPage() {
  const [channelName, setChannelName] = useState("test-room-123");
  const [userName, setUserName] = useState(`User${Math.floor(Math.random() * 1000)}`);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localTracks, setLocalTracks] = useState<{
    videoTrack: ICameraVideoTrack | null;
    audioTrack: IMicrophoneAudioTrack | null;
  }>({ videoTrack: null, audioTrack: null });
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const localVideoRef = useRef<HTMLDivElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveChannel();
    };
  }, [client, localTracks]);

  const joinChannel = async () => {
    if (!channelName.trim()) {
      setError("チャンネル名を入力してください");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Dynamically import Agora SDK
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

      // Get token from API
      const tokenRes = await fetch("/api/test/agora-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelName, uid: 0 }),
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to get Agora token");
      }

      const { token, appId } = await tokenRes.json();

      // Create client
      const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      // Set up event handlers
      agoraClient.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType: "video" | "audio") => {
        await agoraClient.subscribe(user, mediaType);

        if (mediaType === "video") {
          setRemoteUsers(prev => {
            const exists = prev.find(u => u.uid === user.uid);
            if (exists) {
              return prev.map(u => u.uid === user.uid ? user : u);
            }
            return [...prev, user];
          });
        }

        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      agoraClient.on("user-unpublished", (user: IAgoraRTCRemoteUser, mediaType: "video" | "audio") => {
        if (mediaType === "video") {
          setRemoteUsers(prev => prev.map(u => {
            if (u.uid === user.uid) {
              return { ...u, videoTrack: null };
            }
            return u;
          }));
        }
      });

      agoraClient.on("user-left", (user: IAgoraRTCRemoteUser) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      // Join channel
      await agoraClient.join(appId, channelName, token, null);

      // Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();

      // Publish tracks
      await agoraClient.publish([audioTrack, videoTrack]);

      // Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      setClient(agoraClient);
      setLocalTracks({ videoTrack, audioTrack });
      setIsJoined(true);
    } catch (err) {
      console.error("Join error:", err);
      setError(err instanceof Error ? err.message : "参加に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const leaveChannel = async () => {
    if (localTracks.videoTrack) {
      localTracks.videoTrack.stop();
      localTracks.videoTrack.close();
    }
    if (localTracks.audioTrack) {
      localTracks.audioTrack.stop();
      localTracks.audioTrack.close();
    }
    if (client) {
      await client.leave();
    }

    setLocalTracks({ videoTrack: null, audioTrack: null });
    setClient(null);
    setRemoteUsers([]);
    setIsJoined(false);
  };

  const toggleMic = async () => {
    if (localTracks.audioTrack) {
      await localTracks.audioTrack.setEnabled(!isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = async () => {
    if (localTracks.videoTrack) {
      await localTracks.videoTrack.setEnabled(!isCameraOn);
      setIsCameraOn(!isCameraOn);
    }
  };

  const totalUsers = isJoined ? remoteUsers.length + 1 : 0;

  // Grid class based on user count
  const getGridClass = () => {
    if (totalUsers <= 1) return "grid-cols-1";
    if (totalUsers === 2) return "grid-cols-2";
    if (totalUsers <= 4) return "grid-cols-2";
    return "grid-cols-3";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <span>🎥</span> Agoraテスト
          </h1>
          <p className="text-gray-400 mt-1">複数人ビデオ通話テストページ</p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">チャンネル名</label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                disabled={isJoined}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="test-room-123"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">ユーザー名</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={isJoined}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="User1"
              />
            </div>
            <div className="flex gap-2">
              {!isJoined ? (
                <button
                  onClick={joinChannel}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  {isLoading ? "接続中..." : "参加する"}
                </button>
              ) : (
                <button
                  onClick={leaveChannel}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                >
                  退出する
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Video Grid */}
        {isJoined && (
          <>
            <div className="bg-gray-800 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">参加者のビデオ</h2>
                <span className="px-3 py-1 bg-blue-600 rounded-full text-sm">
                  参加人数: {totalUsers}人
                </span>
              </div>

              <div className={`grid ${getGridClass()} gap-4`}>
                {/* Local Video */}
                <div className="relative aspect-video bg-gray-700 rounded-lg overflow-hidden">
                  <div ref={localVideoRef} className="w-full h-full" />
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-sm">
                    {userName} (自分)
                  </div>
                  {!isCameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <span className="text-4xl">📷</span>
                    </div>
                  )}
                </div>

                {/* Remote Videos */}
                {remoteUsers.map((user) => (
                  <RemoteVideo key={user.uid} user={user} />
                ))}
              </div>
            </div>

            {/* Media Controls */}
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={toggleMic}
                className={`px-6 py-3 rounded-full font-medium transition-colors ${
                  isMicOn
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isMicOn ? "🎤 マイクON" : "🔇 マイクOFF"}
              </button>
              <button
                onClick={toggleCamera}
                className={`px-6 py-3 rounded-full font-medium transition-colors ${
                  isCameraOn
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isCameraOn ? "📹 カメラON" : "📷 カメラOFF"}
              </button>
            </div>
          </>
        )}

        {/* Test Instructions */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📋</span> テスト方法
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>複数のブラウザ/デバイスでこのページを開く</li>
            <li>同じチャンネル名を入力</li>
            <li>それぞれ「参加する」をクリック</li>
            <li>全員のビデオが表示されればOK！</li>
          </ol>
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-400">
              <strong>例:</strong> Chrome + Safari + スマホ で3人テスト
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Remote Video Component
function RemoteVideo({ user }: { user: any }) {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user.videoTrack && videoRef.current) {
      user.videoTrack.play(videoRef.current);
    }
  }, [user.videoTrack]);

  return (
    <div className="relative aspect-video bg-gray-700 rounded-lg overflow-hidden">
      <div ref={videoRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-sm">
        User {user.uid}
      </div>
      {!user.videoTrack && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <span className="text-4xl">👤</span>
        </div>
      )}
    </div>
  );
}
