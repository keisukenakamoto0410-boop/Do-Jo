"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // セッションからLINE表示名を自動入力
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 画像サイズチェック（5MB以内）
      if (file.size > 5 * 1024 * 1024) {
        setError("画像サイズは5MB以内にしてください");
        return;
      }

      setProfileImage(file);

      // プレビュー用のURLを生成
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("お名前を入力してください");
      return;
    }

    if (!profileImage) {
      setError("プロフィール写真を選択してください");
      return;
    }

    setLoading(true);

    try {
      // 画像をBase64エンコード
      const reader = new FileReader();
      reader.readAsDataURL(profileImage);

      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const response = await fetch("/api/users/onboarding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            profileImage: base64Image,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "プロフィールの更新に失敗しました");
        }

        // ロールに応じてリダイレクト
        const role = session?.user?.role;
        if (role === "senior") {
          router.push("/senior/dashboard");
        } else if (role === "learner") {
          router.push("/learner/dashboard");
        } else {
          router.push("/");
        }
      };
    } catch (err) {
      console.error("プロフィール更新エラー:", err);
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-extrabold mb-2"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: "linear-gradient(135deg, #00A8CC 0%, #006B7D 50%, #FF6B35 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Do-Jo
          </h1>
          <p className="text-gray-600" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            プロフィールを設定しましょう
          </p>
        </div>

        {/* フォーム */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* プロフィール写真 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロフィール写真 <span className="text-red-500">*</span>
              </label>

              <div className="flex flex-col items-center">
                {/* プレビュー */}
                <div className="mb-4">
                  {previewUrl ? (
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                      <Image
                        src={previewUrl}
                        alt="プロフィール写真"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* アップロードボタン */}
                <label className="cursor-pointer bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    写真を選択
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG（最大5MB）</p>
              </div>
            </div>

            {/* 名前 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田 太郎"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
              />
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "保存中..." : "始める"}
            </button>
          </form>
        </div>

        {/* 注意事項 */}
        <p className="text-center text-xs text-gray-500 mt-4" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
          プロフィール情報はいつでも変更できます
        </p>
      </div>
    </div>
  );
}
