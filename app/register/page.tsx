"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

// 日本語フレーズデータ（全て3文字以内）- 背景用
const phrases = [
  // 日常フレーズ
  { ja: "やば", en: "amazing" },
  { ja: "かわ", en: "cute" },
  { ja: "すご", en: "awesome" },
  { ja: "マジ", en: "seriously" },
  { ja: "えも", en: "emotional" },
  { ja: "草", en: "lol" },
  // オノマトペ
  { ja: "ドキ", en: "heart beat" },
  { ja: "わく", en: "excited" },
  { ja: "もふ", en: "fluffy" },
  { ja: "キラ", en: "sparkling" },
  { ja: "ふわ", en: "soft" },
  { ja: "ぴか", en: "shiny" },
  // 若者言葉・スラング
  { ja: "推し", en: "favorite" },
  { ja: "神", en: "god-tier" },
  { ja: "尊い", en: "precious" },
  { ja: "沼", en: "obsessed" },
  { ja: "映え", en: "photogenic" },
  { ja: "ガチ", en: "for real" },
  // 文化・感情
  { ja: "粋", en: "stylish" },
  { ja: "縁", en: "fate" },
  { ja: "和", en: "harmony" },
  { ja: "侘び", en: "wabi" },
  { ja: "寂び", en: "sabi" },
  { ja: "癒し", en: "healing" },
  // 挨拶・礼儀
  { ja: "乙", en: "good work" },
  { ja: "よろ", en: "nice 2 meet" },
  { ja: "あざ", en: "thanks" },
  { ja: "了解", en: "roger" },
  { ja: "無理", en: "impossible" },
  { ja: "最高", en: "the best" },
];

const row1Phrases = phrases.slice(0, 10);
const row2Phrases = phrases.slice(10, 20);
const row3Phrases = phrases.slice(20, 30);

export default function RegisterPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: dados básicos, 2: perfil

  // Dados básicos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Dados do perfil (learner)
  const [jlptLevel, setJlptLevel] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("Português");
  const [learningGoal, setLearningGoal] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const iconColors = [
    { bg: "rgba(0, 168, 204, 0.15)", border: "rgba(0, 168, 204, 0.3)", text: "#006B7D" },
    { bg: "rgba(255, 107, 53, 0.15)", border: "rgba(255, 107, 53, 0.3)", text: "#E64A19" },
    { bg: "rgba(255, 167, 38, 0.15)", border: "rgba(255, 167, 38, 0.3)", text: "#F57C00" },
    { bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)", text: "#059669" },
    { bg: "rgba(139, 92, 246, 0.15)", border: "rgba(139, 92, 246, 0.3)", text: "#7C3AED" },
  ];

  const renderPhraseRow = (phraseList: typeof phrases, direction: "left" | "right", opacity: number) => {
    const tripled = [...phraseList, ...phraseList, ...phraseList];
    return (
      <div
        className="flex whitespace-nowrap items-center"
        style={{
          animation: `scroll-${direction} ${direction === "left" ? "50s" : "55s"} linear infinite`,
          opacity,
        }}
      >
        {tripled.map((phrase, i) => {
          const color = iconColors[i % iconColors.length];
          return (
            <div
              key={i}
              className="flex flex-col items-center mx-4 md:mx-6"
            >
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-2 border-2 shadow-lg"
                style={{
                  background: color.bg,
                  borderColor: color.border,
                  backdropFilter: "blur(8px)",
                }}
              >
                <span
                  className="text-lg md:text-2xl font-bold"
                  style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    color: color.text,
                  }}
                >
                  {phrase.ja.slice(0, 3)}
                </span>
              </div>
              <span
                className="text-[10px] md:text-xs text-center max-w-[80px] md:max-w-[100px] truncate"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  color: "#566573",
                }}
              >
                {phrase.en}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const handleSubmitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (!agreedToTerms) {
      setError("Você deve concordar com os Termos de Serviço");
      return;
    }

    setStep(2);
  };

  const handleSubmitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Registrar usuário
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          role: "learner",
          agreedToTerms,
          jlptLevel,
          nativeLanguage,
          learningGoal,
          country,
          bio,
          interests,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar conta");
      }

      // Login automático após registro
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        // Redirecionar para dashboard
        window.location.href = "/learner/dashboard";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const availableInterests = [
    "Anime", "Culinária", "Viagem", "Negócios", "Tecnologia",
    "Música", "Esportes", "História", "Arte", "Cultura"
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;600;800&display=swap');

        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }

        @keyframes scroll-right {
          0% { transform: translateX(-33.33%); }
          100% { transform: translateX(0); }
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      <div className="min-h-screen relative overflow-hidden">
        {/* グラデーション背景 */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #F8FAFB 0%, #E6F7FB 50%, #FFF3EE 100%)",
          }}
        />

        {/* グラデーションオーブ */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
          style={{
            background: "radial-gradient(circle, #00A8CC 0%, transparent 70%)",
            top: "-200px",
            right: "-200px",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, #FF6B35 0%, transparent 70%)",
            bottom: "-150px",
            left: "-150px",
          }}
        />

        {/* スクロールフレーズ - 上部 */}
        <div className="absolute top-[3%] md:top-[5%] left-0 right-0 overflow-hidden pointer-events-none">
          {renderPhraseRow(row1Phrases, "left", 0.8)}
        </div>

        {/* スクロールフレーズ - 中上部 */}
        <div className="absolute top-[18%] md:top-[22%] left-0 right-0 overflow-hidden pointer-events-none">
          {renderPhraseRow(row2Phrases, "right", 0.6)}
        </div>

        {/* スクロールフレーズ - 下部 */}
        <div className="absolute bottom-[3%] md:bottom-[5%] left-0 right-0 overflow-hidden pointer-events-none">
          {renderPhraseRow(row3Phrases, "left", 0.7)}
        </div>

        {/* メインコンテンツ */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md transition-all duration-700 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Glassmorphism カード */}
            <div
              className="rounded-3xl p-8 shadow-2xl border border-white/50"
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* ロゴセクション */}
              <div className="text-center mb-6">
                <Link href="/" className="inline-block">
                  <h1
                    className="text-5xl font-extrabold mb-1"
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 800,
                      background: "linear-gradient(135deg, #00A8CC 0%, #006B7D 50%, #FF6B35 100%)",
                      backgroundSize: "200% 200%",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      animation: "float 3s ease-in-out infinite, gradient-shift 4s ease infinite",
                    }}
                  >
                    Do-Jo
                  </h1>
                  <p
                    className="text-xs tracking-[0.25em] text-[#566573]"
                    style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                  >
                    日本語を楽しもう
                  </p>
                </Link>
              </div>

              {/* タイトル */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Criar Conta
                </h2>
                <p className="text-sm text-[#566573]">
                  {step === 1 ? "Passo 1 de 2: Informações básicas" : "Passo 2 de 2: Seu perfil"}
                </p>
              </div>

              {/* エラーメッセージ */}
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>{error}</div>
                  </div>
                </div>
              )}

              {/* フォーム - ステップ1 */}
              {step === 1 && (
                <form onSubmit={handleSubmitStep1} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome completo
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      placeholder="Seu nome"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Senha
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar senha
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      Concordo com os{" "}
                      <Link href="/terms" className="text-sky-600 hover:text-sky-700 underline">
                        Termos de Serviço
                      </Link>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 px-4 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:shadow-lg hover:shadow-sky-500/30"
                  >
                    Próximo →
                  </button>
                </form>
              )}

              {/* フォーム - ステップ2 */}
              {step === 2 && (
                <form onSubmit={handleSubmitStep2} className="space-y-4">
                  <div>
                    <label htmlFor="jlptLevel" className="block text-sm font-medium text-gray-700 mb-2">
                      Nível JLPT
                    </label>
                    <select
                      id="jlptLevel"
                      value={jlptLevel}
                      onChange={(e) => setJlptLevel(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                    >
                      <option value="">Selecione seu nível</option>
                      <option value="N5">N5 (Iniciante)</option>
                      <option value="N4">N4 (Básico)</option>
                      <option value="N3">N3 (Intermediário)</option>
                      <option value="N2">N2 (Avançado)</option>
                      <option value="N1">N1 (Proficiente)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="learningGoal" className="block text-sm font-medium text-gray-700 mb-2">
                      Objetivo de aprendizado
                    </label>
                    <select
                      id="learningGoal"
                      value={learningGoal}
                      onChange={(e) => setLearningGoal(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                    >
                      <option value="">Selecione seu objetivo</option>
                      <option value="business">Japonês de negócios</option>
                      <option value="casual">Conversação casual</option>
                      <option value="both">Ambos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interesses (selecione até 5)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableInterests.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          disabled={!interests.includes(interest) && interests.length >= 5}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            interests.includes(interest)
                              ? "bg-sky-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                      Sobre você (opcional)
                    </label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none"
                      placeholder="Conte um pouco sobre você e seus objetivos..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 px-4 rounded-xl font-semibold transition-all duration-300 bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      ← Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 px-4 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:shadow-lg hover:shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Criando conta...
                        </span>
                      ) : (
                        "Criar conta"
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* ログインへのリンク */}
              {step === 1 && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Já tem uma conta?{" "}
                    <Link href="/login" className="text-sky-600 hover:text-sky-700 font-semibold">
                      Fazer login
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
