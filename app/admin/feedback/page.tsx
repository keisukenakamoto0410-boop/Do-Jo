"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

// Admin emails that can access this page
const ADMIN_EMAILS = ["nakamoto.keisuke.vx@gmail.com"];

interface LearnerStats {
  id: string;
  name: string;
  email: string;
  jlptLevel: string | null;
  country: string | null;
  totalSessions: number;
  feedbackCount: number;
  avgScore: number;
  latestLevel: string;
}

interface FeedbackDetail {
  id: string;
  sessionDate: string;
  hostName: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  totalScore: number;
  level: string;
  message: string | null;
  createdAt: string;
}

interface LearnerDetail {
  id: string;
  name: string;
  email: string;
  jlptLevel: string | null;
  country: string | null;
  totalSessions: number;
  avgScore: number;
  latestLevel: string;
  feedbackCount: number;
}

export default function AdminFeedbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [learners, setLearners] = useState<LearnerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail view state
  const [selectedLearner, setSelectedLearner] = useState<LearnerDetail | null>(
    null
  );
  const [feedbacks, setFeedbacks] = useState<FeedbackDetail[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      session?.user?.email &&
      !ADMIN_EMAILS.includes(session.user.email)
    ) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchLearners = async () => {
      try {
        const res = await fetch("/api/admin/feedback");
        if (!res.ok) {
          if (res.status === 403) {
            router.push("/");
            return;
          }
          throw new Error("Failed to fetch data");
        }
        const data = await res.json();
        setLearners(data.learners);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
      fetchLearners();
    }
  }, [session, router]);

  const fetchLearnerDetail = async (learnerId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/feedback?learnerId=${learnerId}`);
      if (!res.ok) throw new Error("Failed to fetch learner detail");
      const data = await res.json();
      setSelectedLearner(data.learner);
      setFeedbacks(data.feedbacks);
    } catch (err) {
      console.error(err);
      setError("Failed to load learner detail");
    } finally {
      setLoadingDetail(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "JLPT Level",
      "Country",
      "Sessions",
      "Feedbacks",
      "Avg Score",
      "Level",
    ];
    const rows = learners.map((l) => [
      l.name,
      l.email,
      l.jlptLevel || "-",
      l.country || "-",
      l.totalSessions,
      l.feedbackCount,
      l.avgScore,
      l.latestLevel,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `learner-feedback-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "N":
        return "bg-purple-100 text-purple-800";
      case "F":
        return "bg-green-100 text-green-800";
      case "B":
        return "bg-blue-100 text-blue-800";
      case "L":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "N":
        return "Native";
      case "F":
        return "Fluent";
      case "B":
        return "Business";
      case "L":
        return "Learner";
      default:
        return "-";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (
    !session?.user?.email ||
    !ADMIN_EMAILS.includes(session.user.email)
  ) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Do Jo
              </Link>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Admin
              </span>
            </div>
            <span className="text-gray-600">{session.user.email}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Detail View */}
        {selectedLearner ? (
          <div>
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedLearner(null);
                setFeedbacks([]);
              }}
              className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              ← Back to List
            </button>

            {/* Learner Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedLearner.name}
                  </h1>
                  <p className="text-gray-600">{selectedLearner.email}</p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-lg font-bold ${getLevelColor(selectedLearner.latestLevel)}`}
                >
                  {getLevelLabel(selectedLearner.latestLevel)}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedLearner.avgScore}/8
                  </p>
                  <p className="text-sm text-gray-600">Avg Score</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedLearner.feedbackCount}
                  </p>
                  <p className="text-sm text-gray-600">Feedbacks</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedLearner.jlptLevel || "-"}
                  </p>
                  <p className="text-sm text-gray-600">JLPT Level</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedLearner.country || "-"}
                  </p>
                  <p className="text-sm text-gray-600">Country</p>
                </div>
              </div>
            </div>

            {/* Feedback History */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Feedback History
              </h2>

              {loadingDetail ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                </div>
              ) : feedbacks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No feedback yet
                </p>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDate(fb.sessionDate)}
                          </p>
                          <p className="text-sm text-gray-600">
                            with {fb.hostName}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold ${getLevelColor(fb.level)}`}
                          >
                            {fb.totalScore}/8 ({fb.level})
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-500">Q1 Accurate</p>
                          <p className="font-bold">{fb.q1}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-500">Q2 Keigo</p>
                          <p className="font-bold">{fb.q2}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-500">Q3 Natural</p>
                          <p className="font-bold">{fb.q3}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-500">Q4 Native</p>
                          <p className="font-bold">{fb.q4}</p>
                        </div>
                      </div>

                      {fb.message && (
                        <div className="bg-amber-50 rounded-lg p-3 border-l-4 border-amber-400">
                          <p className="text-sm text-gray-700">
                            &ldquo;{fb.message}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Learner List View */
          <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Learner Feedback Dashboard
                </h1>
                <p className="text-gray-600">
                  {learners.length} learners registered
                </p>
              </div>
              <button
                onClick={exportCSV}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Export CSV
              </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {learners.filter((l) => l.latestLevel === "N").length}
                </p>
                <p className="text-sm text-gray-600">Native Level</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {learners.filter((l) => l.latestLevel === "F").length}
                </p>
                <p className="text-sm text-gray-600">Fluent Level</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {learners.filter((l) => l.latestLevel === "B").length}
                </p>
                <p className="text-sm text-gray-600">Business Level</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {learners.filter((l) => l.latestLevel === "L").length}
                </p>
                <p className="text-sm text-gray-600">Learner Level</p>
              </div>
            </div>

            {/* Learner Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Level
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                      Avg Score
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                      Feedbacks
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                      JLPT
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {learners.map((learner) => (
                    <tr key={learner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {learner.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {learner.country || "Unknown"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(learner.latestLevel)}`}
                        >
                          {getLevelLabel(learner.latestLevel)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-gray-900">
                          {learner.feedbackCount > 0
                            ? `${learner.avgScore}/8`
                            : "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {learner.feedbackCount}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {learner.jlptLevel || "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => fetchLearnerDetail(learner.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {learners.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-2">📭</p>
                  <p>No learners registered yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
