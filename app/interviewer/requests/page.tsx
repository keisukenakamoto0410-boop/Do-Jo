"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import RequestCard from "@/components/interviewer/RequestCard";

interface BookingRequest {
  id: string;
  status: string;
  createdAt: string;
  scheduledAt: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    japaneseLevel: string;
  };
  slot: {
    jobCategory: string;
    startTime: string;
    endTime: string;
  };
}

interface Counts {
  pending: number;
  scheduled: number;
  rejected: number;
  all: number;
}

export default function BookingRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [counts, setCounts] = useState<Counts>({
    pending: 0,
    scheduled: 0,
    rejected: 0,
    all: 0,
  });
  const [activeTab, setActiveTab] = useState<
    "pending" | "scheduled" | "rejected" | "all"
  >("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      status === "authenticated" &&
      session?.user?.userType !== "INTERVIEWER"
    ) {
      router.push("/unauthorized");
    } else if (status === "authenticated") {
      fetchRequests(activeTab);
    }
  }, [status, session, router]);

  const fetchRequests = async (filter: string) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        `/api/interviewer/requests?status=${filter}`
      );

      if (!response.ok) {
        throw new Error("リクエストの取得に失敗しました");
      }

      const data = await response.json();
      setRequests(data.requests);
      setCounts(data.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: "pending" | "scheduled" | "rejected" | "all") => {
    setActiveTab(tab);
    fetchRequests(tab);
  };

  const handleApprove = async (interviewId: string) => {
    try {
      const response = await fetch("/api/interview/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "承認に失敗しました");
      }

      setSuccessMessage("面接リクエストを承認しました");
      setTimeout(() => setSuccessMessage(""), 3000);

      // Refresh the list
      fetchRequests(activeTab);
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  const handleReject = async (interviewId: string, reason: string) => {
    try {
      const response = await fetch("/api/interview/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "却下に失敗しました");
      }

      setSuccessMessage("面接リクエストを却下しました");
      setTimeout(() => setSuccessMessage(""), 3000);

      // Refresh the list
      fetchRequests(activeTab);
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => fetchRequests(activeTab)}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">予約リクエスト管理</h1>
          <p className="mt-2 text-gray-600">
            候補者からの面接予約リクエストを確認・管理します
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => handleTabChange("pending")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "pending"
                    ? "border-yellow-500 text-yellow-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                承認待ち
                {counts.pending > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    {counts.pending}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange("scheduled")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "scheduled"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                承認済み
                {counts.scheduled > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                    {counts.scheduled}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange("rejected")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "rejected"
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                却下済み
                {counts.rejected > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                    {counts.rejected}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange("all")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "all"
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                すべて
                {counts.all > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">
                    {counts.all}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">
              {activeTab === "pending" && "承認待ちのリクエストはありません"}
              {activeTab === "scheduled" && "承認済みのリクエストはありません"}
              {activeTab === "rejected" && "却下済みのリクエストはありません"}
              {activeTab === "all" && "リクエストはありません"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
