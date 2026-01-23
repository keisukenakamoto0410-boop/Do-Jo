"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ThankYouMessage {
  id: string;
  reservationId: string;
  learnerName: string;
  message: string;
  rating: number | null;
  emoji: string | null;
  isRead: boolean;
  createdAt: string;
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
