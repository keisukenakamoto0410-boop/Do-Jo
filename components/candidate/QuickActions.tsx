"use client";

import Link from "next/link";

interface QuickActionsProps {
  hasResume: boolean;
  remainingInterviews: number;
  pendingInterviews: number;
}

export default function QuickActions({
  hasResume,
  remainingInterviews,
  pendingInterviews,
}: QuickActionsProps) {
  const actions = [
    {
      title: "面接を予約",
      description: "希望の日時で面接を予約",
      icon: "📅",
      href: "/candidate/book",
      color: "bg-blue-500 hover:bg-blue-600",
      disabled: remainingInterviews === 0,
      badge: remainingInterviews > 0 ? `残り${remainingInterviews}回` : "制限到達",
    },
    {
      title: "履歴書管理",
      description: "履歴書をアップロード・更新",
      icon: "📄",
      href: "/candidate/resume",
      color: "bg-green-500 hover:bg-green-600",
      disabled: false,
      badge: hasResume ? "登録済み" : "未登録",
    },
    {
      title: "面接履歴",
      description: "過去の面接とフィードバック",
      icon: "📚",
      href: "/candidate/history",
      color: "bg-purple-500 hover:bg-purple-600",
      disabled: false,
    },
    {
      title: "プロフィール",
      description: "個人情報とアカウント設定",
      icon: "⚙️",
      href: "/candidate/profile",
      color: "bg-gray-500 hover:bg-gray-600",
      disabled: false,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">クイックアクション</h3>

      {/* Pending Interviews Alert */}
      {pendingInterviews > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-2xl mr-3">⏳</span>
            <div>
              <p className="text-sm font-medium text-yellow-900">
                {pendingInterviews}件の予約リクエストが承認待ちです
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                面接官が承認すると確定します
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`block ${action.disabled ? "pointer-events-none opacity-50" : ""}`}
          >
            <div
              className={`${action.color} text-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-3xl">{action.icon}</div>
                {action.badge && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm">
                    {action.badge}
                  </span>
                )}
              </div>
              <h4 className="text-lg font-bold mb-1">{action.title}</h4>
              <p className="text-sm text-white/80">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Tips Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-xl mr-3">💡</span>
          <div>
            <p className="text-sm font-medium text-blue-900 mb-2">
              面接を最大限に活用するヒント
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 面接の10分前にログインして準備しましょう</li>
              <li>• 履歴書を事前にアップロードしておくと効果的です</li>
              <li>• フィードバックを確認して、次回に活かしましょう</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
