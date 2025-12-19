"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Link from "next/link";

export default function CreatePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [canPostToday, setCanPostToday] = useState(true);
  const [postsUntilBooking, setPostsUntilBooking] = useState(0);
  const [canBookSession, setCanBookSession] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "learner") {
      router.push("/host/dashboard");
    } else {
      checkTodayPost();
    }
  }, [status, session, router]);

  const checkTodayPost = async () => {
    try {
      const response = await fetch("/api/study-posts/check-today");
      const data = await response.json();
      setCanPostToday(!data.hasPostedToday);
      setPostsUntilBooking(data.postsUntilBooking);
      setCanBookSession(data.canBookSession);
    } catch (error) {
      console.error("Failed to check today's post:", error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      alert("Please select an image");
      return;
    }

    if (!canPostToday) {
      alert("You've already posted today");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("caption", caption);

      const response = await fetch("/api/study-posts", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Failed to post");
      }

      const data = await response.json();

      if (data.canBookSession && !canBookSession) {
        alert("Post successful! Session booking is now unlocked!");
      } else if (data.postsUntilBooking > 0) {
        alert(`Post successful! ${data.postsUntilBooking} more posts to unlock booking`);
      } else {
        alert("Post successful!");
      }

      router.push("/learner/dashboard");
    } catch (error) {
      console.error("Post error:", error);
      alert(error instanceof Error ? error.message : "Failed to post");
    } finally {
      setUploading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!canPostToday) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-neutral-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <Link href="/learner/dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">道</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary">Do Jo</h1>
                  <p className="text-xs text-neutral-500">Bridge to Japanese Careers</p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center p-4 mt-12">
          <div className="card max-w-md w-full text-center">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📅</span>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Today's Post Complete!
            </h2>
            <p className="text-neutral-600 mb-6">
              Come back tomorrow to post again
            </p>
            {postsUntilBooking > 0 ? (
              <p className="text-accent font-medium mb-6">
                {postsUntilBooking} more posts to unlock session booking!
              </p>
            ) : (
              <p className="text-success font-medium mb-6">
                Session booking is unlocked!
              </p>
            )}
            <button
              onClick={() => router.push("/learner/dashboard")}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-neutral-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/learner/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">道</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">Do Jo</h1>
                <p className="text-xs text-neutral-500">Bridge to Japanese Careers</p>
              </div>
            </Link>
            <Link
              href="/learner/dashboard"
              className="text-neutral-600 hover:text-neutral-900 font-medium"
            >
              Cancel
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Post Today's Study Log
          </h1>
          <p className="text-neutral-600">
            Share your daily progress and unlock session booking!
          </p>
        </div>

        {/* Progress */}
        {postsUntilBooking > 0 && (
          <div className="bg-gradient-to-r from-accent-50 to-warning/10 border-2 border-accent-200 rounded-xl p-4 mb-6">
            <p className="text-center text-accent-700 font-bold">
              <span className="text-2xl mx-1">{postsUntilBooking}</span> more posts to unlock session booking!
            </p>
            <div className="mt-2 bg-accent-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-accent to-accent-warm h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(10, ((7 - postsUntilBooking) / 7) * 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {canBookSession && (
          <div className="bg-gradient-to-r from-success/10 to-success/5 border-2 border-success/30 rounded-xl p-4 mb-6">
            <p className="text-center text-success font-bold">
              Session booking unlocked! Keep posting to maintain your streak!
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="card">
          {/* Image Upload */}
          <div className="mb-6">
            <label className="label">
              Study Photo
            </label>

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full rounded-xl max-h-96 object-contain bg-neutral-50"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview("");
                  }}
                  className="absolute top-2 right-2 px-3 py-1 bg-error text-white rounded-lg text-sm hover:bg-error-dark transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? "border-primary bg-primary-50"
                    : "border-neutral-200 hover:border-primary hover:bg-neutral-50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-6xl mb-4">📸</div>
                <p className="text-neutral-700 font-medium">
                  Click or drag & drop to upload
                </p>
                <p className="text-neutral-400 text-sm mt-2">
                  Notes, textbooks, study apps, etc.
                </p>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="mb-6">
            <label className="label">
              What did you study today?
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input-field"
              rows={4}
              placeholder="E.g., I practiced business keigo expressions today..."
              maxLength={500}
            />
            <p className="text-xs text-neutral-500 mt-1 text-right">
              {caption.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || !image}
            className="w-full py-4 bg-gradient-to-r from-accent to-accent-warm text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:from-neutral-300 disabled:to-neutral-300 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Posting...
              </span>
            ) : (
              "Post Study Log"
            )}
          </button>

          {/* Notice */}
          <div className="mt-4 text-center text-sm text-neutral-600">
            You can post once per day
          </div>
        </form>
      </div>
    </div>
  );
}
