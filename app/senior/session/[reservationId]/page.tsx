"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

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

    router.push("/senior/dashboard");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
      <div className="bg-sky-600 px-6 py-5 flex items-center justify-between">
        <div className="text-white">
          <h2 className="text-2xl font-bold">ビデオ通話中</h2>
          <p className="text-sky-100 text-lg">
            {reservation?.learner?.name}さんと会話中
          </p>
        </div>

        {/* Timer - Large and visible */}
        <div
          className={`px-8 py-4 rounded-xl font-bold text-3xl ${
            timeLeft <= 5 * 60 ? "bg-red-500 animate-pulse" : "bg-white text-sky-600"
          } ${timeLeft <= 5 * 60 ? "text-white" : ""}`}
        >
          残り {formatTime(timeLeft)}
        </div>
      </div>

      {/* Video Grid - Simplified */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        {/* Local Video (Senior) */}
        <div className="relative bg-gray-800 rounded-2xl overflow-hidden">
          <div
            id="local-video"
            className="w-full h-full"
            style={{ minHeight: "400px" }}
          ></div>
          <div className="absolute bottom-4 left-4 bg-black/70 px-5 py-3 rounded-xl text-white text-xl font-bold">
            あなた
          </div>
        </div>

        {/* Remote Video (Learner) */}
        <div className="relative bg-gray-800 rounded-2xl overflow-hidden">
          <div
            id="remote-video"
            className="w-full h-full"
            style={{ minHeight: "400px" }}
          ></div>
          {remoteUsers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900/50">
              <div className="text-center">
                <div className="text-6xl mb-4">👋</div>
                <p className="text-2xl font-bold">相手を待っています...</p>
              </div>
            </div>
          )}
          {remoteUsers.length > 0 && reservation?.learner && (
            <div className="absolute bottom-4 left-4 bg-black/70 px-5 py-3 rounded-xl text-white text-xl font-bold">
              {reservation.learner.name}さん
            </div>
          )}
        </div>
      </div>

      {/* Controls - Large and Simple */}
      <div className="bg-gray-800 px-6 py-6">
        <button
          onClick={handleSessionEnd}
          className="w-full max-w-md mx-auto block py-6 bg-red-600 hover:bg-red-700 text-white text-2xl font-bold rounded-xl transition-colors shadow-lg"
        >
          🛑 通話を終了する
        </button>
      </div>
    </div>
  );
}
