"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ProductMapping {
  id: string;
  keyword: string;
  amazonUrl: string;
  productName: string;
  category: string;
}

interface Learner {
  id: string;
  name: string;
  avatar: string | null;
  country: string | null;
  hometownFood: string | null;
  hometownFoodDesc: string | null;
  hometownPlace: string | null;
  hometownPlaceDesc: string | null;
}

interface ThankYouMessage {
  id: string;
  reservationId: string;
  learnerName: string;
  message: string;
  rating: number | null;
  emoji: string | null;
  isRead: boolean;
  createdAt: string;
  learner?: Learner | null;
  matchedProduct?: ProductMapping | null;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<ThankYouMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ThankYouMessage | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/thank-you-messages");
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchMessages();
    }
  }, [session]);

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/thank-you-messages/${messageId}/read`, {
        method: "POST",
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m))
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleOpenMessage = (message: ThankYouMessage) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markAsRead(message.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/senior/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                ← 戻る
              </Link>
              <h1 className="text-xl font-bold text-gray-800">
                お礼メッセージ
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount}件の未読
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              まだメッセージがありません
            </h2>
            <p className="text-gray-500">
              セッション後に学習者からお礼メッセージが届きます
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <button
                key={message.id}
                onClick={() => handleOpenMessage(message)}
                className={`w-full text-left p-4 rounded-xl transition ${
                  message.isRead
                    ? "bg-white border border-gray-200 hover:border-gray-300"
                    : "bg-green-50 border-2 border-green-300 hover:border-green-400"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">
                    {message.emoji || "🙏"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-800">
                        {message.learnerName}さんより
                      </span>
                      {!message.isRead && (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {message.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>{formatDate(message.createdAt)}</span>
                      {message.rating && (
                        <span>
                          {"⭐".repeat(message.rating)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Amazon アフィリエイトセクション */}
        <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">
            🇮🇳 インドのチャイはいかがですか？
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            生徒さんの故郷の味を体験してみませんか？
          </p>
          <a
            href="https://www.amazon.co.jp/dp/B0FBM1LN31?tag=dojojp-22"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg transition"
          >
            Amazonで見る →
          </a>
          <p className="text-xs text-gray-500 mt-3">
            ※ このリンクからのご購入がDo Joの運営支援になります。ありがとうございます。
          </p>
        </div>
      </main>

      {/* Message Modal */}
      {selectedMessage && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">
                {selectedMessage.emoji || "🙏"}
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                {selectedMessage.learnerName}さんからのメッセージ
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(selectedMessage.createdAt)}
              </p>
            </div>

            {selectedMessage.rating && (
              <div className="text-center mb-4">
                <span className="text-2xl">
                  {"⭐".repeat(selectedMessage.rating)}
                </span>
              </div>
            )}

            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <p className="text-gray-800 whitespace-pre-wrap">
                {selectedMessage.message}
              </p>
            </div>

            {/* 学習者の地元自慢セクション */}
            {selectedMessage.learner?.hometownFood && (
              <div className="bg-orange-50 rounded-xl p-4 mb-4">
                <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                  <span>🍜</span>
                  {selectedMessage.learnerName}さんの地元の味
                </h3>
                <p className="text-orange-700 font-medium">
                  {selectedMessage.learner.hometownFood}
                </p>
                {selectedMessage.learner.hometownFoodDesc && (
                  <p className="text-orange-600 text-sm mt-1">
                    {selectedMessage.learner.hometownFoodDesc}
                  </p>
                )}
              </div>
            )}

            {/* 商品バナー */}
            {selectedMessage.matchedProduct && (
              <a
                href={selectedMessage.matchedProduct.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-orange-200 rounded-xl p-4 mb-4 hover:border-orange-400 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🛒</div>
                  <div className="flex-1">
                    <p className="text-xs text-orange-600 font-medium mb-1">
                      {selectedMessage.learnerName}さんの地元の味を日本でも!
                    </p>
                    <p className="font-bold text-orange-900 group-hover:text-orange-700 transition">
                      {selectedMessage.matchedProduct.productName}
                    </p>
                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                      <span>Amazonで見る</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </p>
                  </div>
                </div>
              </a>
            )}

            <button
              onClick={() => setSelectedMessage(null)}
              className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
