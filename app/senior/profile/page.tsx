"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { compressAvatar, formatFileSize } from "@/lib/imageCompression";
import { PREFECTURES } from "@/lib/locationData";

export default function SeniorProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [newHobby, setNewHobby] = useState("");
  const [careerHistory, setCareerHistory] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [newExpertise, setNewExpertise] = useState("");
  const [expertiseTopics, setExpertiseTopics] = useState<string[]>([]);
  const [newExpertiseTopic, setNewExpertiseTopic] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

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
      setPrefecture(data.prefecture || "");
      setHobbies(data.hobbies || []);
      setCareerHistory(data.careerHistory || "");
      setExpertise(data.expertise || []);
      setExpertiseTopics(data.expertiseTopics || []);
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
        alert("画像は10MB以下にしてください");
        return;
      }

      // Show preview immediately
      setAvatarPreview(URL.createObjectURL(file));

      // Compress the image
      const originalSize = formatFileSize(file.size);
      const compressed = await compressAvatar(file);
      const compressedSize = formatFileSize(compressed.size);

      console.log(`Avatar compressed: ${originalSize} -> ${compressedSize}`);
      setAvatar(compressed);
    }
  };

  const addHobby = () => {
    if (newHobby.trim() && !hobbies.includes(newHobby.trim())) {
      setHobbies([...hobbies, newHobby.trim()]);
      setNewHobby("");
    }
  };

  const removeHobby = (hobby: string) => {
    setHobbies(hobbies.filter((h) => h !== hobby));
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !expertise.includes(newExpertise.trim())) {
      setExpertise([...expertise, newExpertise.trim()]);
      setNewExpertise("");
    }
  };

  const removeExpertise = (item: string) => {
    setExpertise(expertise.filter((e) => e !== item));
  };

  const addExpertiseTopic = () => {
    if (newExpertiseTopic.trim() && !expertiseTopics.includes(newExpertiseTopic.trim())) {
      setExpertiseTopics([...expertiseTopics, newExpertiseTopic.trim()]);
      setNewExpertiseTopic("");
    }
  };

  const removeExpertiseTopic = (topic: string) => {
    setExpertiseTopics(expertiseTopics.filter((t) => t !== topic));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      formData.append("prefecture", prefecture);
      formData.append("hobbies", JSON.stringify(hobbies));
      formData.append("careerHistory", careerHistory);
      formData.append("expertise", JSON.stringify(expertise));
      formData.append("expertiseTopics", JSON.stringify(expertiseTopics));
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

      alert("プロフィールを更新しました！");
      router.push("/senior/dashboard");
    } catch (error) {
      console.error("Profile update error:", error);
      alert("プロフィールの更新に失敗しました");
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
            href="/senior/dashboard"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← 戻る
          </Link>
          <h1 className="text-xl font-bold text-gray-900">プロフィール編集</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">プロフィール写真</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-sky-500"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-sky-500 flex items-center justify-center text-white text-3xl font-bold">
                    {name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div>
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
                  写真を選択
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  JPG, PNG。最大2MB。
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">表示名</h2>
            <p className="text-sm text-gray-500 mb-4">ニックネームでもOK</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：たろうさん"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg"
              required
            />
          </div>

          {/* Bio */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">自己紹介</h2>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg"
              rows={4}
              placeholder="自己紹介を入力してください"
            />
          </div>

          {/* Career History */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">これまでの経歴</h2>
            <p className="text-sm text-gray-500 mb-4">
              これまでの職歴や経験を教えてください。学習者が会話の参考にします。
            </p>
            <textarea
              value={careerHistory}
              onChange={(e) => setCareerHistory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg"
              rows={5}
              placeholder="例：製造業で30年勤務。品質管理部門で課長を務め、海外工場の立ち上げにも携わりました。退職後は地域のボランティア活動に参加しています。"
            />
          </div>

          {/* Expertise */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">得意分野</h2>
            <p className="text-sm text-gray-500 mb-4">
              仕事で経験した分野や専門知識を追加してください。
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newExpertise}
                onChange={(e) => setNewExpertise(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addExpertise())}
                placeholder="例：営業、人事、製造、経理..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addExpertise}
                className="px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                追加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {expertise.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm flex items-center gap-2"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeExpertise(item)}
                    className="text-amber-500 hover:text-amber-700"
                  >
                    ×
                  </button>
                </span>
              ))}
              {expertise.length === 0 && (
                <p className="text-gray-500">まだ得意分野が登録されていません</p>
              )}
            </div>
          </div>

          {/* Expertise Topics */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">こういう話が得意！</h2>
            <p className="text-sm text-gray-500 mb-4">
              話すのが得意なトピックや、詳しい話題を追加してください。
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newExpertiseTopic}
                onChange={(e) => setNewExpertiseTopic(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addExpertiseTopic())}
                placeholder="例：日本の歴史、野球、料理のコツ..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addExpertiseTopic}
                className="px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                追加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {expertiseTopics.map((topic) => (
                <span
                  key={topic}
                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => removeExpertiseTopic(topic)}
                    className="text-green-500 hover:text-green-700"
                  >
                    ×
                  </button>
                </span>
              ))}
              {expertiseTopics.length === 0 && (
                <p className="text-gray-500">まだ得意な話題が登録されていません</p>
              )}
            </div>
          </div>

          {/* Prefecture */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">お住まいの地域</h2>
            <select
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg"
            >
              <option value="">選択してください</option>
              <option value="北海道">北海道</option>
              <option value="東京都">東京都</option>
              <option value="神奈川県">神奈川県</option>
              <option value="大阪府">大阪府</option>
              <option value="京都府">京都府</option>
              <option value="愛知県">愛知県</option>
              <option value="福岡県">福岡県</option>
              <option value="その他">その他</option>
            </select>
          </div>

          {/* Hobbies */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">趣味</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newHobby}
                onChange={(e) => setNewHobby(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHobby())}
                placeholder="趣味を入力..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addHobby}
                className="px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                追加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {hobbies.map((hobby) => (
                <span
                  key={hobby}
                  className="px-3 py-1.5 bg-sky-100 text-sky-700 rounded-full text-sm flex items-center gap-2"
                >
                  {hobby}
                  <button
                    type="button"
                    onClick={() => removeHobby(hobby)}
                    className="text-sky-500 hover:text-sky-700"
                  >
                    ×
                  </button>
                </span>
              ))}
              {hobbies.length === 0 && (
                <p className="text-gray-500">まだ趣味が登録されていません</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 bg-sky-500 text-white rounded-xl font-bold text-lg hover:bg-sky-600 disabled:opacity-50 transition-colors"
            >
              {saving ? "保存中..." : "保存する"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-4 border border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
