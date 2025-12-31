"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";

interface AnalysisResult {
  session_id: string;
  analyzed_at: string;
  extracted_data: {
    grammar_points: string[];
    vocabulary: string[];
    topic_category: string;
    difficulty_level: string;
  };
  ai_generated_output: {
    suggested_questions: string[];
    learning_focus: string;
    praise_comment: string;
  };
}

interface StudyLog {
  id: string;
  reservationId: string;
  learnerId: string;
  imageUrl: string;
  imageOrder: number;
  analysisResult: AnalysisResult | null;
  hostLiked: boolean;
  hostComment: string | null;
  uploadedAt: string;
}

interface Reservation {
  id: string;
  sessionType: string;
  readyToTalk: boolean;
  studyLogCount: number;
  slot: {
    startTime: string;
  };
  host: {
    name: string;
  };
}

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [analyzingSlot, setAnalyzingSlot] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const progress = (studyLogs.length / 4) * 100;
  const isReady = studyLogs.length === 4;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchData = useCallback(async () => {
    try {
      // Fetch reservation
      const resRes = await fetch(`/api/reservations/${reservationId}`);
      if (resRes.ok) {
        const data = await resRes.json();
        setReservation(data.reservation);
      }

      // Fetch study logs
      const logsRes = await fetch(`/api/reservations/${reservationId}/study-logs`);
      if (logsRes.ok) {
        const logs = await logsRes.json();
        setStudyLogs(logs);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    if (session?.user && reservationId) {
      fetchData();
    }
  }, [session, reservationId, fetchData]);

  const handleUpload = async (files: File[], slot: number) => {
    const file = files[0];
    if (!file) return;

    setUploadingSlot(slot);

    try {
      // 1. Upload image
      const formData = new FormData();
      formData.append("image", file);
      formData.append("slot", slot.toString());

      const uploadResponse = await fetch(
        `/api/reservations/${reservationId}/study-logs`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Upload failed");
      }

      const uploadData = await uploadResponse.json();
      setUploadingSlot(null);
      setAnalyzingSlot(slot);

      // 2. Start AI analysis
      const analyzeResponse = await fetch(
        `/api/reservations/${reservationId}/study-logs/${uploadData.id}/analyze`,
        { method: "POST" }
      );

      const analyzedLog = await analyzeResponse.json();

      // 3. Update state
      setStudyLogs((prev) => [...prev, analyzedLog]);

      // 4. If 4 logs, mark as ready
      if (studyLogs.length + 1 === 4) {
        await fetch(`/api/reservations/${reservationId}/ready`, {
          method: "POST",
        });
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingSlot(null);
      setAnalyzingSlot(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || !reservation) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-green-50">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {["🎉", "🎊", "✨", "🌟", "💫"][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/learner/reservations`}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              ← Back
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Submit Study Logs</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Session Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Scheduled Session</p>
              <p className="font-bold text-lg text-gray-900">
                {formatDate(reservation.slot.startTime)}
              </p>
              <p className="text-gray-600">with {reservation.host.name}</p>
            </div>
            <span className="px-4 py-2 rounded-full text-sm font-bold bg-purple-100 text-purple-800">
              🎓 Casual
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">📚 Submit Your Study Logs</h2>
          <p className="text-gray-600">
            Upload 4 photos of your notes, textbooks, study apps, etc.
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Progress</h3>
            <span className="text-2xl font-bold text-blue-600">
              {studyLogs.length}/4
            </span>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-8 overflow-hidden mb-4 relative">
            <div
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-full rounded-full transition-all duration-700 ease-out flex items-center justify-center"
              style={{ width: `${progress}%` }}
            >
              {progress > 15 && (
                <span className="text-white font-bold text-sm drop-shadow">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
            {/* Milestone markers */}
            {[25, 50, 75].map((milestone) => (
              <div
                key={milestone}
                className={`absolute top-0 bottom-0 w-0.5 ${
                  progress >= milestone ? "bg-white/50" : "bg-gray-300"
                }`}
                style={{ left: `${milestone}%` }}
              />
            ))}
          </div>

          {/* Ready Badge */}
          {isReady && (
            <div className="flex items-center justify-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl p-4 animate-pulse">
              <span className="text-4xl">🎉</span>
              <span className="text-2xl font-bold text-green-700">
                Ready to Talk!
              </span>
              <span className="text-4xl">🎉</span>
            </div>
          )}
        </div>

        {/* Upload Slots */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {[1, 2, 3, 4].map((slot) => {
            const log = studyLogs.find((l) => l.imageOrder === slot);
            const isUploading = uploadingSlot === slot;
            const isAnalyzing = analyzingSlot === slot;

            return (
              <UploadSlot
                key={slot}
                slot={slot}
                log={log}
                isUploading={isUploading}
                isAnalyzing={isAnalyzing}
                onDrop={(files) => handleUpload(files, slot)}
                disabled={!!log || isUploading || isAnalyzing || uploadingSlot !== null}
              />
            );
          })}
        </div>

        {/* AI Analysis Results */}
        {studyLogs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span>📊</span> AI Analysis Results
            </h3>

            <div className="space-y-4">
              {studyLogs.map((log) => (
                <AnalysisCard key={log.id} log={log} />
              ))}
            </div>
          </div>
        )}

        {/* Session Mission */}
        {isReady && studyLogs[0]?.analysisResult && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white mb-8">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>🎯</span> Today's Mission
            </h3>
            <div className="bg-white/20 backdrop-blur rounded-xl p-6">
              <p className="text-lg mb-4">
                {studyLogs[0].analysisResult.ai_generated_output.learning_focus}
              </p>
              <div className="space-y-3">
                <p className="font-bold text-white/80">Topics for Conversation:</p>
                {studyLogs
                  .flatMap((log) => log.analysisResult?.ai_generated_output?.suggested_questions || [])
                  .slice(0, 4)
                  .map((q, i) => (
                    <div
                      key={i}
                      className="flex items-start space-x-3 bg-white/10 rounded-lg p-3"
                    >
                      <span className="text-xl">💬</span>
                      <span>{q}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Completion Button */}
        {isReady && (
          <div className="text-center">
            <Link
              href={`/learner/reservations`}
              className="inline-block px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xl font-bold rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Done ✓
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

// Upload Slot Component
function UploadSlot({
  slot,
  log,
  isUploading,
  isAnalyzing,
  onDrop,
  disabled,
}: {
  slot: number;
  log?: StudyLog;
  isUploading: boolean;
  isAnalyzing: boolean;
  onDrop: (files: File[]) => void;
  disabled: boolean;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled,
  });

  // Uploaded state
  if (log) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-transform">
        <div className="relative">
          <img
            src={log.imageUrl}
            alt={`Study ${slot}`}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
            <span>✓</span> Done
          </div>
          {log.hostLiked && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              👍 Liked!
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-gray-900">Photo {slot}</span>
          </div>
          {log.analysisResult?.ai_generated_output?.praise_comment && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3 border border-green-200">
              {log.analysisResult.ai_generated_output.praise_comment}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Upload state
  return (
    <div
      {...getRootProps()}
      className={`border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all min-h-[240px] flex flex-col items-center justify-center ${
        disabled && !isUploading && !isAnalyzing
          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
          : isDragActive
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-lg"
      }`}
    >
      <input {...getInputProps()} />

      {isUploading ? (
        <>
          <div className="animate-bounce text-6xl mb-4">⬆️</div>
          <p className="font-bold text-blue-600 mb-2">Uploading...</p>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse rounded-full" style={{ width: "60%" }} />
          </div>
        </>
      ) : isAnalyzing ? (
        <>
          <div className="animate-spin text-6xl mb-4">🔍</div>
          <p className="font-bold text-purple-600 mb-2">AI Analyzing...</p>
          <p className="text-sm text-gray-500">Reviewing your study materials</p>
        </>
      ) : (
        <>
          <div className={`text-6xl mb-4 ${isDragActive ? "animate-bounce" : ""}`}>
            {isDragActive ? "📥" : "📷"}
          </div>
          <p className="font-bold text-gray-900 mb-2">Photo {slot}</p>
          <p className="text-sm text-gray-600">
            {isDragActive ? "Drop here!" : "Click or drop to upload"}
          </p>
        </>
      )}
    </div>
  );
}

// Analysis Card Component
function AnalysisCard({ log }: { log: StudyLog }) {
  const analysis = log.analysisResult;
  if (!analysis) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
      <div className="flex items-start gap-4">
        <img
          src={log.imageUrl}
          alt="Study"
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0 shadow"
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-purple-700 mb-2 text-lg">
            {analysis.ai_generated_output.praise_comment}
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
              📊 {analysis.extracted_data.difficulty_level}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
              📚 {analysis.extracted_data.topic_category}
            </span>
          </div>

          {analysis.extracted_data.grammar_points.length > 0 && (
            <div className="mb-2">
              <span className="text-sm font-bold text-gray-700">Grammar: </span>
              <span className="text-sm text-gray-600">
                {analysis.extracted_data.grammar_points.join(", ")}
              </span>
            </div>
          )}

          {analysis.extracted_data.vocabulary.length > 0 && (
            <div>
              <span className="text-sm font-bold text-gray-700">Vocabulary: </span>
              <span className="text-sm text-gray-600">
                {analysis.extracted_data.vocabulary.slice(0, 5).join(", ")}
                {analysis.extracted_data.vocabulary.length > 5 && "..."}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
