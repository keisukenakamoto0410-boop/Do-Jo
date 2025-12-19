"use client";

import { useState, useEffect, useCallback } from "react";

interface StudyPost {
  id: string;
  imageUrl: string;
  caption: string | null;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    country: string | null;
    jlptLevel: string | null;
  };
}

export default function LearnerPostFeed() {
  const [posts, setPosts] = useState<StudyPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<StudyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [popularLoading, setPopularLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [likingPost, setLikingPost] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchPopularPosts();
  }, []);

  const fetchPosts = async (cursor?: string) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      }

      const url = cursor
        ? `/api/study-posts/feed?cursor=${cursor}`
        : "/api/study-posts/feed";

      const response = await fetch(url);
      const data = await response.json();

      if (cursor) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts || []);
      }
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchPopularPosts = async () => {
    try {
      setPopularLoading(true);
      const response = await fetch("/api/study-posts/popular");
      const data = await response.json();
      setPopularPosts(data.posts || []);
    } catch (error) {
      console.error("Failed to fetch popular posts:", error);
    } finally {
      setPopularLoading(false);
    }
  };

  const handleLike = async (postId: string, isPopular: boolean = false) => {
    if (likingPost) return;

    setLikingPost(postId);

    try {
      const response = await fetch(`/api/study-posts/${postId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();

        const updatePost = (post: StudyPost) =>
          post.id === postId
            ? {
                ...post,
                isLiked: data.liked,
                likeCount: post.likeCount + (data.liked ? 1 : -1),
              }
            : post;

        setPosts((prev) => prev.map(updatePost));
        setPopularPosts((prev) => prev.map(updatePost));
      }
    } catch (error) {
      console.error("Failed to like post:", error);
    } finally {
      setLikingPost(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "たった今";
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  const getCountryFlag = (country: string | null) => {
    const flags: Record<string, string> = {
      "Vietnam": "🇻🇳",
      "China": "🇨🇳",
      "Korea": "🇰🇷",
      "Taiwan": "🇹🇼",
      "Philippines": "🇵🇭",
      "Indonesia": "🇮🇩",
      "Thailand": "🇹🇭",
      "USA": "🇺🇸",
      "UK": "🇬🇧",
      "Brazil": "🇧🇷",
      "India": "🇮🇳",
    };
    return flags[country || ""] || "🌍";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-48 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 今週の人気投稿 */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🔥</span>
          <h2 className="text-2xl font-bold text-gray-900">今週の人気投稿</h2>
          <span className="text-sm text-gray-500">Top 5</span>
        </div>

        {popularLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0 w-48 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-xl mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : popularPosts.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
            {popularPosts.map((post, index) => (
              <div
                key={post.id}
                className="flex-shrink-0 w-56 bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Rank Badge */}
                <div className="relative">
                  <img
                    src={post.imageUrl}
                    alt="学習記録"
                    className="w-full h-40 object-cover"
                  />
                  <div className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? "bg-yellow-500" :
                    index === 1 ? "bg-gray-400" :
                    index === 2 ? "bg-amber-600" :
                    "bg-gray-600"
                  }`}>
                    {index + 1}
                  </div>
                </div>

                <div className="p-3">
                  {/* User Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {post.user.avatar ? (
                        <img
                          src={post.user.avatar}
                          alt={post.user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        post.user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {post.user.name}
                    </span>
                    <span>{getCountryFlag(post.user.country)}</span>
                  </div>

                  {/* Caption */}
                  {post.caption && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {post.caption}
                    </p>
                  )}

                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(post.id, true)}
                    disabled={likingPost === post.id}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-all ${
                      post.isLiked
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span>{post.isLiked ? "❤️" : "🤍"}</span>
                    <span className="font-medium">{post.likeCount}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">今週はまだ投稿がありません</p>
          </div>
        )}
      </div>

      {/* 学習者の投稿（タイムライン） */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            学習者の投稿
          </h2>
          <button
            onClick={() => fetchPosts()}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            更新
          </button>
        </div>

      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
            >
              {/* User Info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {post.user.avatar ? (
                    <img
                      src={post.user.avatar}
                      alt={post.user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    post.user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {post.user.name}
                    </span>
                    <span className="text-lg">
                      {getCountryFlag(post.user.country)}
                    </span>
                    {post.user.jlptLevel && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {post.user.jlptLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(post.createdAt)}
                  </p>
                </div>
              </div>

              {/* Image */}
              <div className="mb-3">
                <img
                  src={post.imageUrl}
                  alt="学習記録"
                  className="w-full max-h-96 object-contain rounded-xl bg-gray-50"
                />
              </div>

              {/* Caption */}
              {post.caption && (
                <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                  {post.caption}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(post.id)}
                  disabled={likingPost === post.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    post.isLiked
                      ? "bg-red-50 text-red-600"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-xl">{post.isLiked ? "❤️" : "🤍"}</span>
                  <span className="font-medium">{post.likeCount}</span>
                </button>
                <span className="text-sm text-gray-500">
                  頑張っていますね！
                </span>
              </div>
            </div>
          ))}

          {/* Load More */}
          {nextCursor && (
            <div className="text-center pt-4">
              <button
                onClick={() => fetchPosts(nextCursor)}
                disabled={loadingMore}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {loadingMore ? "読み込み中..." : "もっと見る"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-6xl mb-4">📭</p>
          <p className="text-gray-500">まだ投稿がありません</p>
          <p className="text-sm text-gray-400 mt-2">
            学習者が投稿すると、ここに表示されます
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
