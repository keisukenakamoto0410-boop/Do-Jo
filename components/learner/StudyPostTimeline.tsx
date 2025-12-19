"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
  };
}

interface StudyPostTimelineProps {
  userId: string;
}

export default function StudyPostTimeline({ userId }: StudyPostTimelineProps) {
  const [posts, setPosts] = useState<StudyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    canBookSession: false,
    postsUntilBooking: 7,
    minPostsRequired: 7,
  });
  const [canPostToday, setCanPostToday] = useState(true);

  useEffect(() => {
    fetchPosts();
    checkTodayPost();
  }, [userId]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/study-posts`);
      const data = await response.json();
      setPosts(data.posts || []);
      if (data.stats) {
        setStats({
          ...data.stats,
          minPostsRequired: data.stats.minPostsRequired || data.stats.totalPosts + data.stats.postsUntilBooking || 7,
        });
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayPost = async () => {
    try {
      const response = await fetch("/api/study-posts/check-today");
      const data = await response.json();
      setCanPostToday(!data.hasPostedToday);
    } catch (error) {
      console.error("Failed to check today's post:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-neutral-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header with Stats */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2 flex items-center gap-2">
            <span className="text-2xl">📸</span>
            Your Study Log
          </h2>
          <div className="flex items-center gap-4 text-sm text-neutral-600">
            <span className="font-medium">{stats.totalPosts} posts</span>
            {stats.canBookSession ? (
              <span className="badge-success">
                Session booking unlocked!
              </span>
            ) : (
              <span className="badge-warning">
                {stats.postsUntilBooking} more to unlock booking
              </span>
            )}
          </div>
        </div>

        {/* Post Button */}
        <Link
          href="/learner/post"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-[1.02] ${
            canPostToday
              ? "btn-accent"
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
          }`}
          onClick={(e) => !canPostToday && e.preventDefault()}
        >
          <span className="text-lg">📸</span>
          <span>{canPostToday ? "Post Today's Log" : "Posted Today"}</span>
        </Link>
      </div>

      {/* Progress Bar */}
      {!stats.canBookSession && (
        <div className="mb-6 bg-gradient-to-r from-accent-50 to-warning/10 border border-accent-200 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-accent-700 font-medium">
              Unlock session booking
            </span>
            <span className="text-accent-700 font-bold">
              {stats.totalPosts}/{stats.minPostsRequired} posts
            </span>
          </div>
          <div className="bg-accent-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-accent to-accent-warm h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (stats.totalPosts / stats.minPostsRequired) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="relative aspect-square group cursor-pointer"
            >
              <img
                src={post.imageUrl}
                alt="Study log"
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                <div className="text-white text-center">
                  <p className="text-lg font-bold flex items-center gap-1">
                    <span>❤️</span> {post.likeCount}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {formatDate(post.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📝</span>
          </div>
          <p className="text-neutral-600 mb-2">No posts yet</p>
          <p className="text-sm text-neutral-500 mb-6">
            Post your daily study logs to unlock session booking!
          </p>
          {canPostToday && (
            <Link
              href="/learner/post"
              className="btn-accent"
            >
              Create Your First Post
            </Link>
          )}
        </div>
      )}

      {/* Motivation Message */}
      {!stats.canBookSession && stats.postsUntilBooking > 0 && stats.postsUntilBooking <= 3 && (
        <div className="mt-6 text-center p-4 bg-primary-50 rounded-xl">
          <p className="text-primary-dark font-medium">
            {stats.postsUntilBooking === 3 && "Great progress! Just 3 more posts to go!"}
            {stats.postsUntilBooking === 2 && "Almost there! Only 2 more posts needed!"}
            {stats.postsUntilBooking === 1 && "One more post to unlock booking!"}
          </p>
        </div>
      )}
    </div>
  );
}
