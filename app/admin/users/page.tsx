"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

// Admin emails that can access this page
const ADMIN_EMAILS = ["keisuke.mjugaad91@gmail.com"];

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  jlptLevel: string | null;
  nativeLanguage: string | null;
  country: string | null;
  prefecture: string | null;
  ageRange: string | null;
  university: string | null;
  totalTalkTime: number;
  averageRating: number;
  totalSessions: number;
  createdAt: string;
  lastLoginAt: string | null;
}

interface Stats {
  total: number;
  byRole: Record<string, number>;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedRole !== "all") {
          params.set("role", selectedRole);
        }
        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (!res.ok) {
          if (res.status === 403) {
            router.push("/");
            return;
          }
          throw new Error("Failed to fetch data");
        }
        const data = await res.json();
        setUsers(data.users);
        setStats(data.stats);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
      fetchUsers();
    }
  }, [session, router, selectedRole]);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get role display name and color
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "learner":
        return { name: "学習者", color: "bg-blue-100 text-blue-800" };
      case "senior":
        return { name: "シニア", color: "bg-amber-100 text-amber-800" };
      case "student":
        return { name: "大学生", color: "bg-green-100 text-green-800" };
      case "admin":
        return { name: "管理者", color: "bg-red-100 text-red-800" };
      default:
        return { name: role, color: "bg-gray-100 text-gray-800" };
    }
  };

  // Filter users by search query
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.country && user.country.toLowerCase().includes(query)) ||
      (user.prefecture && user.prefecture.toLowerCase().includes(query))
    );
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return null;
  }

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
            <nav className="flex items-center gap-4">
              <Link
                href="/admin/reservations"
                className="text-gray-600 hover:text-gray-900"
              >
                予約管理
              </Link>
              <Link
                href="/admin/users"
                className="text-gray-900 font-medium"
              >
                ユーザー一覧
              </Link>
              <Link
                href="/admin/feedback"
                className="text-gray-600 hover:text-gray-900"
              >
                スコア一覧
              </Link>
              <Link
                href="/admin/products"
                className="text-gray-600 hover:text-gray-900"
              >
                商品管理
              </Link>
              <span className="text-gray-600">{session.user.email}</span>
            </nav>
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

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">総ユーザー数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-50 rounded-xl shadow p-4">
              <p className="text-sm text-blue-600">学習者</p>
              <p className="text-2xl font-bold text-blue-900">
                {stats.byRole.learner || 0}
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl shadow p-4">
              <p className="text-sm text-amber-600">シニア</p>
              <p className="text-2xl font-bold text-amber-900">
                {stats.byRole.senior || 0}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl shadow p-4">
              <p className="text-sm text-green-600">大学生</p>
              <p className="text-2xl font-bold text-green-900">
                {stats.byRole.student || 0}
              </p>
            </div>
            <div className="bg-red-50 rounded-xl shadow p-4">
              <p className="text-sm text-red-600">管理者</p>
              <p className="text-2xl font-bold text-red-900">
                {stats.byRole.admin || 0}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="名前、メール、国で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Role Filter */}
            <div className="flex gap-2">
              {[
                { value: "all", label: "すべて" },
                { value: "learner", label: "学習者" },
                { value: "senior", label: "シニア" },
                { value: "student", label: "大学生" },
                { value: "admin", label: "管理者" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedRole(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedRole === option.value
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    ロール
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    詳細
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    セッション
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    登録日
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    最終ログイン
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const roleDisplay = getRoleDisplay(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-500 text-lg">
                                {user.name[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${roleDisplay.color}`}
                        >
                          {roleDisplay.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {user.role === "learner" && (
                            <>
                              {user.country && <span>{user.country}</span>}
                              {user.jlptLevel && (
                                <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                  {user.jlptLevel}
                                </span>
                              )}
                            </>
                          )}
                          {user.role === "senior" && (
                            <>
                              {user.prefecture && <span>{user.prefecture}</span>}
                              {user.ageRange && (
                                <span className="ml-2 text-gray-500">
                                  {user.ageRange}
                                </span>
                              )}
                            </>
                          )}
                          {user.role === "student" && user.university && (
                            <span>{user.university}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">
                            {user.totalSessions}回
                          </p>
                          <p className="text-gray-500">
                            {user.totalTalkTime}分
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(user.lastLoginAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p className="text-4xl mb-2">👤</p>
              <p>ユーザーが見つかりません</p>
            </div>
          )}
        </div>

        {/* User Count */}
        <div className="mt-4 text-sm text-gray-500 text-right">
          {filteredUsers.length}件のユーザーを表示中
        </div>
      </main>
    </div>
  );
}
