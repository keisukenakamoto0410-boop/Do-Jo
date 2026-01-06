"use client";

import { useState, useEffect } from "react";

export default function DemoSeniorSessionPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);

  // カンペ（話題・質問例）
  const conversationTopics = [
    {
      title: "自己紹介",
      questions: [
        "お名前を教えてください",
        "どちらの国から来ましたか？",
        "日本語はどのくらい勉強していますか？",
        "日本に来てどのくらいですか？",
      ],
      tips: "ゆっくり、はっきり話しましょう",
    },
    {
      title: "志望動機",
      questions: [
        "なぜこの会社に入りたいですか？",
        "この仕事のどんなところに興味がありますか？",
        "将来どんな仕事をしたいですか？",
      ],
      tips: "相手の目を見て聞きましょう",
    },
    {
      title: "長所・短所",
      questions: [
        "あなたの長所は何ですか？",
        "苦手なことはありますか？",
        "チームで働くのは得意ですか？",
      ],
      tips: "うなずきながら聞くと良いです",
    },
    {
      title: "経験・スキル",
      questions: [
        "アルバイトの経験はありますか？",
        "どんなスキルがありますか？",
        "パソコンは使えますか？",
      ],
      tips: "分からなければ聞き返しましょう",
    },
    {
      title: "フリートーク",
      questions: [
        "休みの日は何をしていますか？",
        "日本の好きなところはどこですか？",
        "最近楽しかったことは何ですか？",
      ],
      tips: "リラックスして話しましょう",
    },
  ];

  const currentTopic = conversationTopics[currentTopicIndex];

  // Mock learner data
  const learner = {
    name: "Maria Garcia",
    country: "Philippines",
    level: "N3",
  };

  useEffect(() => {
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
          alert("あと5分です！");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [joined]);

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);

      setTimeout(() => {
        const localVideo = document.getElementById(
          "local-video"
        ) as HTMLVideoElement;
        if (localVideo) {
          localVideo.srcObject = stream;
          localVideo.play();
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
    alert("通話を終了しました（デモ）");
  };

  const nextTopic = () => {
    setCurrentTopicIndex((prev) =>
      prev < conversationTopics.length - 1 ? prev + 1 : 0
    );
  };

  const prevTopic = () => {
    setCurrentTopicIndex((prev) =>
      prev > 0 ? prev - 1 : conversationTopics.length - 1
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* メイン画面 */}
      <div className="flex-1 flex flex-col">
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="text-center bg-white rounded-2xl p-12 max-w-md mx-4">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-sky-500 border-t-transparent mx-auto mb-6"></div>
              <p className="text-2xl font-bold text-gray-900 mb-2">接続中...</p>
              <p className="text-lg text-gray-600">
                カメラとマイクの許可を求められたら
                <br />
                「許可」をクリックしてください
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-sky-600 px-6 py-4 flex items-center justify-between">
          <div className="text-white">
            <h2 className="text-2xl font-bold">ビデオ通話中（デモ）</h2>
            <p className="text-sky-100 text-lg">{learner.name}さんと会話中</p>
          </div>

          {/* Timer */}
          <div
            className={`px-8 py-4 rounded-xl font-bold text-3xl ${
              timeLeft <= 5 * 60
                ? "bg-red-500 animate-pulse text-white"
                : "bg-white text-sky-600"
            }`}
          >
            残り {formatTime(timeLeft)}
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 grid grid-cols-2 gap-4 p-4">
          {/* Local Video (Senior) */}
          <div className="relative bg-gray-800 rounded-2xl overflow-hidden">
            <video
              id="local-video"
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ minHeight: "300px", transform: "scaleX(-1)" }}
            />
            <div className="absolute bottom-4 left-4 bg-black/70 px-5 py-3 rounded-xl text-white text-xl font-bold">
              あなた
            </div>
          </div>

          {/* Remote Video (Learner) */}
          <div className="relative bg-gray-800 rounded-2xl overflow-hidden">
            <div className="w-full h-full" style={{ minHeight: "300px" }}>
              <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900/50">
                <div className="text-center">
                  <div className="text-6xl mb-4">👤</div>
                  <p className="text-2xl font-bold">相手を待っています...</p>
                  <p className="text-gray-400 mt-2">
                    {learner.name} ({learner.country})
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 bg-black/70 px-5 py-3 rounded-xl text-white text-xl font-bold">
              {learner.name}さん
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 px-6 py-4">
          <button
            onClick={handleEndSession}
            className="w-full max-w-md mx-auto block py-5 bg-red-600 hover:bg-red-700 text-white text-2xl font-bold rounded-xl transition-colors shadow-lg"
          >
            通話を終了する
          </button>
        </div>
      </div>

      {/* カンペ（右サイドバー） */}
      <div className="w-96 bg-white border-l-4 border-sky-500 flex flex-col">
        {/* 相手の情報 */}
        <div className="bg-sky-50 p-4 border-b">
          <h3 className="text-lg font-bold text-sky-800 mb-2">相手の情報</h3>
          <div className="space-y-1 text-gray-700">
            <p>
              <span className="font-medium">名前:</span> {learner.name}
            </p>
            <p>
              <span className="font-medium">出身:</span> {learner.country}
            </p>
            <p>
              <span className="font-medium">日本語レベル:</span> {learner.level}
            </p>
          </div>
        </div>

        {/* トピック切り替え */}
        <div className="bg-sky-600 text-white p-4 flex items-center justify-between">
          <button
            onClick={prevTopic}
            className="p-2 hover:bg-sky-700 rounded-lg text-2xl"
          >
            ◀
          </button>
          <div className="text-center">
            <p className="text-sm opacity-80">
              トピック {currentTopicIndex + 1}/{conversationTopics.length}
            </p>
            <h3 className="text-2xl font-bold">{currentTopic.title}</h3>
          </div>
          <button
            onClick={nextTopic}
            className="p-2 hover:bg-sky-700 rounded-lg text-2xl"
          >
            ▶
          </button>
        </div>

        {/* 質問例 */}
        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="text-lg font-bold text-gray-800 mb-3">
            質問の例
          </h4>
          <ul className="space-y-3">
            {currentTopic.questions.map((question, index) => (
              <li
                key={index}
                className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg"
              >
                <p className="text-xl text-gray-800 font-medium">{question}</p>
              </li>
            ))}
          </ul>

          {/* ヒント */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="font-bold text-green-800 mb-2">ポイント</h4>
            <p className="text-green-700 text-lg">{currentTopic.tips}</p>
          </div>

          {/* 便利なフレーズ */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-bold text-blue-800 mb-3">便利なフレーズ</h4>
            <ul className="space-y-2 text-blue-700">
              <li className="text-lg">「もう一度言ってください」</li>
              <li className="text-lg">「ゆっくり話してください」</li>
              <li className="text-lg">「よくできました！」</li>
              <li className="text-lg">「いい質問ですね」</li>
            </ul>
          </div>
        </div>

        {/* デモ表示 */}
        <div className="bg-yellow-100 border-t-2 border-yellow-400 p-3 text-center">
          <p className="text-yellow-800 font-bold">
            デモモード - DB接続不要
          </p>
        </div>
      </div>
    </div>
  );
}
