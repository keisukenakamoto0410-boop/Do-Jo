"use client";

import { useState, useEffect } from "react";

export default function DemoSessionPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Mock reservation data
  const reservation = {
    sessionType: "Interview Practice",
    host: {
      name: "Tanaka Kenji",
      avatar: null,
    },
  };

  useEffect(() => {
    // Initialize camera
    initCamera();
  }, []);

  // Timer
  useEffect(() => {
    if (!joined) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
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

  const initCamera = async () => {
    try {
      console.log("Requesting camera/microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log("Camera access granted");
      setLocalStream(stream);

      // Play local video
      setTimeout(() => {
        const localVideo = document.getElementById(
          "local-video"
        ) as HTMLVideoElement;
        if (localVideo) {
          localVideo.srcObject = stream;
          localVideo.play();
          console.log("Local video playing");
        }
      }, 100);

      setJoined(true);
      setLoading(false);
    } catch (err) {
      console.error("Camera access error:", err);
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndSession = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    alert("Session ended! (Demo)");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative">
      {/* Loading Overlay */}
      {loading && (
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

      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="text-white">
          <h2 className="text-xl font-bold">Video Session (DEMO)</h2>
          <p className="text-sm text-gray-400">
            {loading ? "Connecting..." : joined ? "Connected" : "Ready"}
          </p>
        </div>

        {/* Timer */}
        <div
          className={`px-6 py-3 rounded-lg font-bold text-2xl ${
            timeLeft <= 5 * 60 ? "bg-red-500" : "bg-green-500"
          } text-white`}
        >
          {formatTime(timeLeft)}
        </div>

        <button
          onClick={handleEndSession}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
        >
          End Session
        </button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-xl overflow-hidden">
          <video
            id="local-video"
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ minHeight: "400px" }}
          />
          <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded text-white text-sm font-medium">
            You {joined && "(Connected)"}
          </div>
        </div>

        {/* Remote Video (Demo - shows waiting state) */}
        <div className="relative bg-gray-800 rounded-xl overflow-hidden">
          <div
            className="w-full h-full"
            style={{ minHeight: "400px" }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900/50">
              <div className="text-center">
                <div className="text-6xl mb-4">👤</div>
                <p className="text-xl font-medium">Waiting for host...</p>
                <p className="text-sm text-gray-400 mt-2">
                  {joined ? "Connected to channel" : "Connecting..."}
                </p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded text-white text-sm font-medium">
            Host
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div className="absolute top-20 right-4 bg-gray-800 rounded-xl p-4 text-white w-64 max-w-sm hidden lg:block">
        <h3 className="font-bold mb-3 text-lg">Session Info</h3>
        <div className="text-sm space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Type:</span>
            <span className="px-2 py-1 bg-purple-600 rounded text-xs">
              {reservation.sessionType}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Duration:</span>
            <span>25 minutes</span>
          </div>
          <div className="pt-3 border-t border-gray-700">
            <p className="text-gray-400 text-xs mb-2">Host</p>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {reservation.host.name?.[0]?.toUpperCase()}
              </div>
              <span className="font-medium">{reservation.host.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium">
        DEMO MODE - No database connection required
      </div>
    </div>
  );
}
