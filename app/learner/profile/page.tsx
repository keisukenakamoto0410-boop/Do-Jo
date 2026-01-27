"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { compressAvatar, formatFileSize } from "@/lib/imageCompression";
import { COUNTRIES } from "@/lib/locationData";

const JLPT_LEVELS = [
  { value: "N1", label: "N1 (Advanced)" },
  { value: "N2", label: "N2 (Upper-Intermediate)" },
  { value: "N3", label: "N3 (Intermediate)" },
  { value: "N4", label: "N4 (Lower-Intermediate)" },
  { value: "N5", label: "N5 (Beginner)" },
  { value: "none", label: "No JLPT level yet" },
];

const LEARNING_GOALS = [
  { value: "business", label: "Business", icon: "💼", desc: "For work and career" },
  { value: "travel", label: "Travel", icon: "✈️", desc: "For trips to Japan" },
  { value: "culture", label: "Culture", icon: "🎌", desc: "Anime, manga, etc." },
  { value: "friends", label: "Friends", icon: "👥", desc: "Make Japanese friends" },
  { value: "academic", label: "Academic", icon: "📚", desc: "Study in Japan" },
];

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [country, setCountry] = useState("");
  const [jlptLevel, setJlptLevel] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bioWarning, setBioWarning] = useState(false);

  // 地元自慢
  const [hometownFood, setHometownFood] = useState("");
  const [hometownFoodDesc, setHometownFoodDesc] = useState("");
  const [hometownPlace, setHometownPlace] = useState("");
  const [hometownPlaceDesc, setHometownPlaceDesc] = useState("");

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  // Check for Japanese characters in bio
  useEffect(() => {
    if (bio.length > 0) {
      const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(bio);
      setBioWarning(!hasJapanese);
    } else {
      setBioWarning(false);
    }
  }, [bio]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();

      setName(data.name || "");
      setBio(data.bio || "");
      setAvatarPreview(data.avatar || "");
      setCountry(data.country || "");
      setJlptLevel(data.jlptLevel || "");
      setLearningGoal(data.learningGoal || "");
      setHometownFood(data.hometownFood || "");
      setHometownFoodDesc(data.hometownFoodDesc || "");
      setHometownPlace(data.hometownPlace || "");
      setHometownPlaceDesc(data.hometownPlaceDesc || "");
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Image must be less than 10MB");
        return;
      }

      setAvatarPreview(URL.createObjectURL(file));

      const originalSize = formatFileSize(file.size);
      const compressed = await compressAvatar(file);
      const compressedSize = formatFileSize(compressed.size);

      console.log(`Avatar compressed: ${originalSize} -> ${compressedSize}`);
      setAvatar(compressed);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      formData.append("country", country);
      formData.append("jlptLevel", jlptLevel);
      formData.append("learningGoal", learningGoal);
      formData.append("hometownFood", hometownFood);
      formData.append("hometownFoodDesc", hometownFoodDesc);
      formData.append("hometownPlace", hometownPlace);
      formData.append("hometownPlaceDesc", hometownPlaceDesc);
      if (avatar) {
        formData.append("avatar", avatar);
      }

      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      alert("Profile updated successfully!");
      router.push("/learner/dashboard");
    } catch (error) {
      console.error("Profile update error:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/learner/dashboard"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Photo</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-sky-500"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-sky-500 flex items-center justify-center text-white text-3xl font-bold">
                    {name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="px-4 py-2 bg-sky-500 text-white rounded-lg cursor-pointer hover:bg-sky-600 inline-block transition-colors"
                >
                  Choose Photo
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  JPG, PNG. Max 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Display Name</h2>
            <p className="text-sm text-gray-500 mb-4">Nickname is OK</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg"
              placeholder="Your Name or Nickname"
              required
            />
          </div>

          {/* Country */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Country</h2>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg"
            >
              <option value="">Select your country</option>
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.flag} {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* JLPT Level */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Japanese Level (JLPT)</h2>
            <select
              value={jlptLevel}
              onChange={(e) => setJlptLevel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg"
            >
              <option value="">Select your level</option>
              {JLPT_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Learning Goal */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Learning Goal</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LEARNING_GOALS.map((goal) => (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => setLearningGoal(goal.value)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    learningGoal === goal.value
                      ? "border-sky-500 bg-sky-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl block mb-1">{goal.icon}</span>
                  <span className="font-medium text-gray-900 block">{goal.label}</span>
                  <span className="text-xs text-gray-500">{goal.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bio with Japanese encouragement */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              About You / Self-Introduction
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Please write in Japanese! This helps Japanese speakers understand you better.
            </p>

            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg"
              rows={5}
              placeholder="日本語で自己紹介を書いてください（例：私はインドから来ました。ITエンジニアです。日本の文化に興味があります。）"
            />

            {/* Character count */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">{bio.length}/200</span>
              {bioWarning && bio.length > 0 && (
                <span className="text-sm text-amber-600 flex items-center gap-1">
                  <span>⚠️</span>
                  日本語で書くことをおすすめします
                </span>
              )}
            </div>

            {/* Example section */}
            <div className="mt-4 p-4 bg-sky-50 rounded-xl border border-sky-200">
              <p className="text-sm font-medium text-sky-800 mb-2 flex items-center gap-2">
                <span>📝</span> Example / 例文:
              </p>
              <p className="text-sm text-sky-700 whitespace-pre-line">
{`はじめまして。私はラジェシュです。
インドのバンガロールから来ました。
ITエンジニアとして働いています。
日本語を勉強して2年です。
趣味は映画を見ることです。
よろしくお願いします！`}
              </p>
            </div>

            {/* Hint */}
            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                💡 日本語で書くと、日本人の方があなたのことを理解しやすくなります。
              </p>
            </div>
          </div>

          {/* Hometown Pride Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              🌍 Share Your Hometown
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Tell Japanese seniors about your hometown! This helps them learn about your culture.
            </p>

            {/* Famous Food */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-xl">🍛</span>
                My Hometown&apos;s Famous Food
              </h3>
              <input
                type="text"
                value={hometownFood}
                onChange={(e) => setHometownFood(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent mb-2"
                placeholder="e.g., ビリヤニ, パエリア, フォー..."
              />
              <label className="block text-sm text-gray-600 mb-1">
                Describe it in Japanese:
              </label>
              <input
                type="text"
                value={hometownFoodDesc}
                onChange={(e) => setHometownFoodDesc(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="e.g., スパイスたっぷりの炊き込みご飯です"
              />
            </div>

            {/* Must-Visit Place */}
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-xl">🏛️</span>
                Must-Visit Place in My Hometown
              </h3>
              <input
                type="text"
                value={hometownPlace}
                onChange={(e) => setHometownPlace(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent mb-2"
                placeholder="e.g., バックウォーター, アンコールワット..."
              />
              <label className="block text-sm text-gray-600 mb-1">
                Describe it in Japanese:
              </label>
              <input
                type="text"
                value={hometownPlaceDesc}
                onChange={(e) => setHometownPlaceDesc(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="e.g., 美しい水郷地帯です"
              />
            </div>

            {/* Hint */}
            <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
              <p className="text-sm text-sky-800">
                💡 This helps Japanese seniors learn about your culture and gives you topics to talk about!
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 bg-sky-500 text-white rounded-xl font-bold text-lg hover:bg-sky-600 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-4 border border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
