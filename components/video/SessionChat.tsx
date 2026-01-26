"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface SessionChatProps {
  reservationId: string;
  currentUserId: string;
  language?: "en" | "ja";
}

export default function SessionChat({
  reservationId,
  currentUserId,
  language = "en",
}: SessionChatProps) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastReadRef = useRef<number>(0);

  // メッセージ取得
  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);

        // 未読カウント更新（開いていない時のみ）
        if (!expanded) {
          const newMessages = (data.messages || []).filter(
            (m: Message) => new Date(m.createdAt).getTime() > lastReadRef.current && m.sender.id !== currentUserId
          );
          setUnreadCount(newMessages.length);
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  // 初回取得とポーリング
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000); // 2秒ごとに更新
    return () => clearInterval(interval);
  }, [reservationId]);

  // 開いた時に既読にする
  useEffect(() => {
    if (expanded) {
      setUnreadCount(0);
      lastReadRef.current = Date.now();
    }
  }, [expanded]);

  // 新しいメッセージが来たらスクロール
  useEffect(() => {
    if (expanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, expanded]);

  // メッセージ送信（楽観的更新）
  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: "You", avatar: null },
    };

    // 即時表示（楽観的更新）
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");

    setSending(true);
    try {
      await fetch(`/api/reservations/${reservationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: tempMessage.content }),
      });
      // 次のポーリングで正式なメッセージに置き換わる
    } catch (error) {
      console.error("Failed to send message:", error);
      // エラー時は一時メッセージを削除
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === "ja" ? "ja-JP" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed bottom-4 left-4 z-30">
      {/* Expanded Panel */}
      {expanded && (
        <div className="mb-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 w-80 h-96 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <span>💬</span>
              {language === "en" ? "Chat" : "チャット"}
            </h3>
            <button
              onClick={() => setExpanded(false)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">
                {language === "en"
                  ? "No messages yet. Say hello!"
                  : "まだメッセージがありません"}
              </div>
            ) : (
              messages.map((message) => {
                const isMe = message.sender.id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] ${
                        isMe
                          ? "bg-blue-500 text-white rounded-l-xl rounded-tr-xl"
                          : "bg-white text-gray-900 rounded-r-xl rounded-tl-xl border border-gray-200"
                      } px-3 py-2 shadow-sm`}
                    >
                      {!isMe && (
                        <p className="text-xs text-gray-500 mb-1">
                          {message.sender.name}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isMe ? "text-blue-100" : "text-gray-400"
                        }`}
                      >
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  language === "en" ? "Type a message..." : "メッセージを入力..."
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? "..." : language === "en" ? "Send" : "送信"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 relative"
      >
        <span className="text-2xl text-white">💬</span>
        {/* Unread badge */}
        {unreadCount > 0 && !expanded && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
