"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  country?: string;
  jlptLevel?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface Reservation {
  id: string;
  status: string;
  selectedTopic?: string;
  slot: {
    startTime: string;
    endTime: string;
  };
  host: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  learner: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    country?: string;
    jlptLevel?: string;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "reservations" | "stats">("reservations");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/senior/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchData();
    }
  }, [status, session]);

  const fetchData = async () => {
    try {
      const [usersRes, reservationsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/reservations"),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (reservationsRes.ok) {
        const reservationsData = await reservationsRes.json();
        setReservations(reservationsData.reservations || []);
      }
    } catch (error) {
      console.error("データ取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-purple-100 text-purple-800",
      senior: "bg-orange-100 text-orange-800",
      learner: "bg-blue-100 text-blue-800",
      student: "bg-green-100 text-green-800",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const userStats = {
    total: users.length,
    admin: users.filter(u => u.role === "admin").length,
    senior: users.filter(u => u.role === "senior").length,
    learner: users.filter(u => u.role === "learner").length,
  };

  const reservationStats = {
    total: reservations.length,
    upcoming: reservations.filter(r => new Date(r.slot.startTime) > new Date()).length,
    past: reservations.filter(r => new Date(r.slot.startTime) <= new Date()).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/senior/dashboard"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              ← シニアダッシュボード
            </Link>
            <p className="text-sm text-gray-600">{session?.user?.name}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-gray-600 text-sm font-medium mb-2">総ユーザー数</h3>
            <p className="text-3xl font-bold text-gray-900">{userStats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-gray-600 text-sm font-medium mb-2">シニア</h3>
            <p className="text-3xl font-bold text-orange-600">{userStats.senior}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-gray-600 text-sm font-medium mb-2">学習者</h3>
            <p className="text-3xl font-bold text-blue-600">{userStats.learner}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-gray-600 text-sm font-medium mb-2">予定予約数</h3>
            <p className="text-3xl font-bold text-purple-600">{reservationStats.upcoming}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("reservations")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "reservations"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                予約・マッチング
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                ユーザー一覧
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Reservations Tab */}
            {activeTab === "reservations" && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  予約・マッチング状況
                </h2>
                {reservations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">予約がありません</p>
                ) : (
                  <div className="space-y-3">
                    {reservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {formatDate(reservation.slot.startTime)}
                              </span>
                              {reservation.selectedTopic && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {reservation.selectedTopic}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-8">
                              {/* Host */}
                              <div className="flex items-center gap-2">
                                {reservation.host.avatar ? (
                                  <img
                                    src={reservation.host.avatar}
                                    alt={reservation.host.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center">
                                    <span className="text-xs font-bold text-orange-700">H</span>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {reservation.host.name}
                                  </p>
                                  <p className="text-xs text-gray-500">ホスト</p>
                                </div>
                              </div>

                              {/* Arrow */}
                              <div className="text-gray-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                              </div>

                              {/* Learner */}
                              <div className="flex items-center gap-2">
                                {reservation.learner.avatar ? (
                                  <img
                                    src={reservation.learner.avatar}
                                    alt={reservation.learner.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                                    <span className="text-xs font-bold text-blue-700">L</span>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {reservation.learner.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {reservation.learner.country || "学習者"}
                                    {reservation.learner.jlptLevel && ` (${reservation.learner.jlptLevel})`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  登録ユーザー一覧
                </h2>
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">ユーザーがいません</p>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-bold text-gray-600">
                                {user.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {user.country && (
                            <span className="text-sm text-gray-600">{user.country}</span>
                          )}
                          {user.jlptLevel && (
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {user.jlptLevel}
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
