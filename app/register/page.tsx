"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { COUNTRIES, PREFECTURES } from "@/lib/locationData";
import AnimatedBackground from "@/components/AnimatedBackground";

type UserRole = "learner" | "senior" | "student";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    bio: "",
    interests: [] as string[],
    languages: [] as string[],
    // Learner fields
    jlptLevel: "",
    nativeLanguage: "",
    learningGoal: "",
    country: "",
    wantsToWorkInJapan: false,
    // Senior fields
    careerHistory: "",
    expertise: [] as string[],
    ageRange: "",
    prefecture: "",
    // Student fields
    university: "",
    major: "",
    graduationYear: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Check for type param in URL (student registration is disabled)
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam && ["learner", "senior"].includes(typeParam)) {
      setRole(typeParam as UserRole);
      setStep(2);
    }
  }, [searchParams]);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayChange = (field: string, value: string) => {
    setFormData((prev) => {
      const currentValues = prev[field as keyof typeof prev] as string[];
      if (currentValues.includes(value)) {
        return { ...prev, [field]: currentValues.filter((v) => v !== value) };
      } else {
        return { ...prev, [field]: [...currentValues, value] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service to continue");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role,
          graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : null,
          agreedToTerms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (role === "learner") {
        // Redirect new learners to profile page to complete their profile
        router.push("/learner/profile");
      } else if (role === "senior") {
        router.push("/senior/dashboard");
      } else {
        router.push("/host/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground showBottomRow={true} phrasesInBackground={true}>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1
                className="text-4xl font-extrabold mb-2"
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
              <p
                className="text-[#566573] text-sm"
                style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                日本語を楽しもう
              </p>
            </Link>
          </div>

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div>
              <h2
                className="text-3xl font-bold text-center text-gray-900 mb-3"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Create Your Account
              </h2>
              <p
                className="text-center text-[#566573] mb-10"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Choose how you want to use Do-Jo
              </p>

              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {/* Foreign Learner */}
                <button
                  onClick={() => handleRoleSelect("learner")}
                  className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-[1.02] text-left border-2 border-white/50 hover:border-[#00A8CC] group"
                >
                  <div className="text-6xl mb-4">🌏</div>
                  <h3
                    className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-[#00A8CC]"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    I want to learn Japanese
                  </h3>
                  <p className="text-[#566573] mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Practice with native speakers
                  </p>
                  <ul className="text-sm space-y-2 text-gray-500">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#00A8CC]/10 text-[#00A8CC] flex items-center justify-center text-xs">✓</span>
                      Real business conversations
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#00A8CC]/10 text-[#00A8CC] flex items-center justify-center text-xs">✓</span>
                      Native Japanese speakers
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#00A8CC]/10 text-[#00A8CC] flex items-center justify-center text-xs">✓</span>
                      Cultural insights
                    </li>
                  </ul>
                </button>

                {/* Japanese Senior */}
                <button
                  onClick={() => handleRoleSelect("senior")}
                  className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-[1.02] text-left border-2 border-white/50 hover:border-[#FF6B35] group"
                >
                  <div className="text-6xl mb-4">🏯</div>
                  <h3
                    className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-[#FF6B35]"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Share my experience (Senior)
                  </h3>
                  <p className="text-[#566573] mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Help foreigners succeed in Japan
                  </p>
                  <ul className="text-sm space-y-2 text-gray-500">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center text-xs">✓</span>
                      Share your expertise
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center text-xs">✓</span>
                      Flexible schedule
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center text-xs">✓</span>
                      Make an impact
                    </li>
                  </ul>
                </button>
              </div>

              <div className="mt-10 text-center">
                <p className="text-[#566573]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#00A8CC] hover:text-[#006B7D] font-semibold">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Registration Form */}
          {step === 2 && role && (
            <div
              className="max-w-2xl mx-auto rounded-2xl shadow-xl p-8 border border-white/50"
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(20px)",
              }}
            >
              <button
                onClick={() => setStep(1)}
                className="text-[#566573] hover:text-gray-700 mb-4 flex items-center gap-1 font-medium transition-colors"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">
                  {role === "learner" ? "🌏" : role === "senior" ? "🏯" : "🎓"}
                </span>
                <div>
                  <h2
                    className="text-2xl font-bold text-gray-900"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {role === "learner" ? "Create Learner Account" : role === "senior" ? "Create Senior Host Account" : "Create Student Host Account"}
                  </h2>
                  <p className="text-sm text-[#566573]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {role === "learner" ? "Start your Japanese learning journey" : "Help learners succeed in Japan"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Basic Info */}
                <div className="space-y-4">
                  <h3
                    className="font-semibold text-gray-700 border-b border-gray-100 pb-2"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Basic Information
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {role === "learner" ? "Display Name" : "表示名"} <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      {role === "learner" ? "Nickname is OK" : "ニックネームでもOK"}
                    </p>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-gray-900 placeholder-[#9AA5B1] focus:outline-none focus:ring-2 focus:ring-[#00A8CC] focus:border-transparent transition-all"
                      placeholder={role === "learner" ? "Your Name or Nickname" : "例：たろうさん"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-gray-900 placeholder-[#9AA5B1] focus:outline-none focus:ring-2 focus:ring-[#00A8CC] focus:border-transparent transition-all"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-gray-900 placeholder-[#9AA5B1] focus:outline-none focus:ring-2 focus:ring-[#00A8CC] focus:border-transparent transition-all"
                      placeholder="8+ characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Self Introduction
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-gray-900 placeholder-[#9AA5B1] focus:outline-none focus:ring-2 focus:ring-[#00A8CC] focus:border-transparent transition-all resize-none"
                      placeholder={role === "learner" ? "Tell us about yourself and your goals" : "簡単な自己紹介をお書きください"}
                    />
                  </div>
                </div>

                {/* Learner Fields */}
                {role === "learner" && (
                  <div className="space-y-4">
                    <h3
                      className="font-semibold text-gray-700 border-b border-gray-100 pb-2"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      About Your Learning
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A8CC] focus:border-transparent transition-all"
                      >
                        <option value="">Select your country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.flag} {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Native Language
                      </label>
                      <input
                        type="text"
                        name="nativeLanguage"
                        value={formData.nativeLanguage}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-gray-900 placeholder-[#9AA5B1] focus:outline-none focus:ring-2 focus:ring-[#00A8CC] focus:border-transparent transition-all"
                        placeholder="e.g., English, Hindi"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Japanese Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="jlptLevel"
                        value={formData.jlptLevel}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A8CC] focus:border-transparent transition-all"
                      >
                        <option value="">Select your level</option>
                        <option value="N1">N1 (Advanced)</option>
                        <option value="N2">N2 (Upper-Intermediate)</option>
                        <option value="N3">N3 (Intermediate)</option>
                        <option value="N4">N4 (Lower-Intermediate)</option>
                        <option value="N5">N5 (Beginner)</option>
                        <option value="beginner">Complete Beginner</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Learning Goal
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { value: "business", label: "💼 Business", desc: "Keigo & formal" },
                          { value: "casual", label: "🎉 Casual", desc: "Daily talk" },
                          { value: "both", label: "📚 Both", desc: "All types" },
                        ].map((item) => (
                          <label
                            key={item.value}
                            className={`flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              formData.learningGoal === item.value
                                ? "border-[#00A8CC] bg-[#00A8CC]/5"
                                : "border-[#E4E7EB] hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="learningGoal"
                                value={item.value}
                                checked={formData.learningGoal === item.value}
                                onChange={handleChange}
                                className="text-[#00A8CC]"
                              />
                              <span className="font-medium text-gray-900">{item.label}</span>
                            </div>
                            <p className="text-xs text-[#566573] mt-1 ml-6">{item.desc}</p>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-3 cursor-pointer p-4 bg-[#00A8CC]/5 rounded-xl border-2 border-[#00A8CC]/20 hover:border-[#00A8CC]/40 transition-colors">
                        <input
                          type="checkbox"
                          name="wantsToWorkInJapan"
                          checked={formData.wantsToWorkInJapan}
                          onChange={handleChange}
                          className="rounded text-[#00A8CC] w-5 h-5"
                        />
                        <div>
                          <span className="text-gray-900 font-medium">I want to work in Japan</span>
                          <p className="text-xs text-[#566573]">We&apos;ll connect you with career-focused hosts</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Senior Fields */}
                {role === "senior" && (
                  <div className="space-y-4">
                    <h3
                      className="font-semibold text-gray-700 border-b border-gray-100 pb-2"
                      style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                    >
                      ご経験について
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        年代 <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="ageRange"
                        value={formData.ageRange}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-all"
                      >
                        <option value="">選択してください</option>
                        <option value="50s">50代</option>
                        <option value="60s">60代</option>
                        <option value="70s">70代</option>
                        <option value="80s">80代以上</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        お住まいの地域
                      </label>
                      <select
                        name="prefecture"
                        value={formData.prefecture}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-all"
                      >
                        <option value="">選択してください</option>
                        {PREFECTURES.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        これまでのキャリア
                      </label>
                      <textarea
                        name="careerHistory"
                        value={formData.careerHistory}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-gray-900 placeholder-[#9AA5B1] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-all resize-none"
                        placeholder="例: 大手メーカーで営業部長として30年勤務。人材育成や海外営業を担当。"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        得意分野（複数選択可）
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["営業", "人事", "製造", "IT", "経理", "マーケティング", "経営", "法務", "その他"].map((item) => (
                          <label
                            key={item}
                            className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              formData.expertise.includes(item)
                                ? "border-[#FF6B35] bg-[#FF6B35]/5"
                                : "border-[#E4E7EB] hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.expertise.includes(item)}
                              onChange={() => handleArrayChange("expertise", item)}
                              className="rounded text-[#FF6B35]"
                            />
                            <span className="text-sm text-gray-900">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Student Fields */}
                {role === "student" && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 border-b border-gray-100 pb-2">
                      大学について
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        大学名
                      </label>
                      <input
                        type="text"
                        name="university"
                        value={formData.university}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-gray-900 placeholder-[#9AA5B1] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="例: 東京大学"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        専攻
                      </label>
                      <input
                        type="text"
                        name="major"
                        value={formData.major}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-gray-900 placeholder-[#9AA5B1] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="例: 経済学部"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        卒業予定年
                      </label>
                      <select
                        name="graduationYear"
                        value={formData.graduationYear}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      >
                        <option value="">選択してください</option>
                        {[2025, 2026, 2027, 2028, 2029].map((year) => (
                          <option key={year} value={year}>{year}年</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        興味・趣味（複数選択可）
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["アニメ", "旅行", "音楽", "スポーツ", "料理", "ゲーム", "映画", "ファッション", "テクノロジー"].map((item) => (
                          <label
                            key={item}
                            className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              formData.interests.includes(item)
                                ? "border-purple-500 bg-purple-50"
                                : "border-[#E4E7EB] hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.interests.includes(item)}
                              onChange={() => handleArrayChange("interests", item)}
                              className="rounded text-purple-600"
                            />
                            <span className="text-sm text-gray-900">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms of Service Agreement */}
                <div className="mb-6">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-5 h-5 mt-1 text-[#00A8CC] border-gray-300 rounded focus:ring-[#00A8CC]"
                    />
                    <span className="text-sm text-[#566573]">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="text-[#00A8CC] hover:underline font-medium"
                      >
                        Terms of Service
                      </Link>
                      {" "}and{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="text-[#00A8CC] hover:underline font-medium"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !agreedToTerms}
                  className="w-full py-3 px-6 bg-gradient-to-r from-[#FF6B35] to-[#FFA726] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Back to home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-[#566573] hover:text-gray-700 text-sm transition-colors"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <AnimatedBackground showBottomRow={true} phrasesInBackground={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1
              className="text-4xl font-extrabold mb-2 animate-pulse"
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
            <p className="text-[#566573]">Loading...</p>
          </div>
        </div>
      </AnimatedBackground>
    }>
      <RegisterContent />
    </Suspense>
  );
}
