"use client";

interface CandidateInfoProps {
  candidate: {
    id: string;
    name: string;
    email: string;
    japaneseLevel: string;
    profile?: any;
  };
  interviewDate: string;
  interviewTime: {
    start: string;
    end: string;
  };
  jobCategory: string;
  resume?: {
    id: string;
    fileUrl: string;
    fileName: string;
    uploadedAt: string;
  } | null;
}

export default function CandidateInfo({
  candidate,
  interviewDate,
  interviewTime,
  jobCategory,
  resume,
}: CandidateInfoProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getJapaneseLevelColor = (level: string) => {
    switch (level) {
      case "N1":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "N2":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "N3":
        return "bg-green-100 text-green-800 border-green-300";
      case "N4":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "N5":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "IT":
        return "💻";
      case "営業":
        return "💼";
      case "事務":
        return "📋";
      default:
        return "🔖";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6">
        <div className="flex items-center space-x-4">
          {/* Profile Photo Placeholder */}
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-teal-600 shadow-lg">
            {getInitials(candidate.name)}
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">
              {candidate.name}
            </h2>
            <p className="text-teal-100 text-sm">{candidate.email}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Japanese Level */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            日本語レベル
          </h3>
          <span
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getJapaneseLevelColor(
              candidate.japaneseLevel
            )}`}
          >
            {candidate.japaneseLevel}
          </span>
        </div>

        {/* Interview Details */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">面接情報</h3>
          <div className="space-y-3">
            <div className="flex items-center text-gray-700">
              <span className="w-24 text-sm font-medium text-gray-500">
                カテゴリー:
              </span>
              <span className="flex items-center">
                <span className="mr-2">{getCategoryIcon(jobCategory)}</span>
                {jobCategory}
              </span>
            </div>

            <div className="flex items-center text-gray-700">
              <span className="w-24 text-sm font-medium text-gray-500">
                日時:
              </span>
              <span>{formatDate(interviewDate)}</span>
            </div>

            <div className="flex items-center text-gray-700">
              <span className="w-24 text-sm font-medium text-gray-500">
                時間:
              </span>
              <span>
                {formatTime(interviewTime.start)} -{" "}
                {formatTime(interviewTime.end)}
              </span>
            </div>
          </div>
        </div>

        {/* Resume Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">履歴書</h3>
          {resume ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {resume.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      アップロード日:{" "}
                      {new Date(resume.uploadedAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                </div>
                <a
                  href={resume.fileUrl}
                  download
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                >
                  ダウンロード
                </a>
              </div>

              {/* PDF Viewer (if PDF) */}
              {resume.fileName.toLowerCase().endsWith(".pdf") && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <iframe
                    src={resume.fileUrl}
                    className="w-full h-96"
                    title="Resume Preview"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-gray-500 text-sm">
                履歴書がアップロードされていません
              </p>
            </div>
          )}
        </div>

        {/* Additional Profile Info */}
        {candidate.profile && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              プロフィール
            </h3>
            <div className="text-sm text-gray-700 space-y-2">
              {typeof candidate.profile === "object" ? (
                Object.entries(candidate.profile).map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="w-32 font-medium text-gray-500">
                      {key}:
                    </span>
                    <span>{String(value)}</span>
                  </div>
                ))
              ) : (
                <p>{String(candidate.profile)}</p>
              )}
            </div>
          </div>
        )}

        {/* Contact Actions */}
        <div className="border-t border-gray-200 pt-6">
          <a
            href={`mailto:${candidate.email}`}
            className="w-full flex items-center justify-center px-4 py-3 bg-white border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-medium"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            メールを送信
          </a>
        </div>
      </div>
    </div>
  );
}
