"use client";

interface EncouragementCardProps {
  message: string;
  interviewerName: string;
  interviewerPhoto?: string;
  overallScore: number;
}

export default function EncouragementCard({
  message,
  interviewerName,
  interviewerPhoto,
  overallScore,
}: EncouragementCardProps) {
  // Get emoji based on score
  const getScoreEmoji = () => {
    const scoreOn5Scale = overallScore / 20;
    if (scoreOn5Scale >= 4.5) return "🌟";
    if (scoreOn5Scale >= 4.0) return "⭐";
    if (scoreOn5Scale >= 3.5) return "✨";
    if (scoreOn5Scale >= 3.0) return "💫";
    if (scoreOn5Scale >= 2.0) return "💪";
    return "🌱";
  };

  // Get background gradient based on score
  const getGradientClass = () => {
    const scoreOn5Scale = overallScore / 20;
    if (scoreOn5Scale >= 4.0) {
      return "bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500";
    } else if (scoreOn5Scale >= 3.0) {
      return "bg-gradient-to-br from-orange-300 via-yellow-400 to-orange-500";
    } else {
      return "bg-gradient-to-br from-amber-300 via-orange-300 to-amber-400";
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${getGradientClass()} p-1 shadow-2xl`}
    >
      {/* Inner white card */}
      <div className="bg-white rounded-xl p-8 md:p-10">
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 text-6xl opacity-20 animate-pulse">
          {getScoreEmoji()}
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-full mb-4">
            <p className="text-sm font-bold text-orange-900 tracking-wide">
              面接官からの応援メッセージ
            </p>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            頑張りましたね！
          </h2>
        </div>

        {/* Message */}
        <div className="mb-8 relative">
          <div className="absolute -left-2 top-0 text-6xl text-orange-200 leading-none">
            "
          </div>
          <blockquote className="pl-8 pr-4">
            <p className="text-xl md:text-2xl leading-relaxed text-gray-800 font-medium">
              {message}
            </p>
          </blockquote>
          <div className="absolute -right-2 bottom-0 text-6xl text-orange-200 leading-none">
            "
          </div>
        </div>

        {/* Interviewer info */}
        <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
          {interviewerPhoto ? (
            <img
              src={interviewerPhoto}
              alt={interviewerName}
              className="w-16 h-16 rounded-full object-cover border-4 border-orange-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center border-4 border-orange-200">
              <span className="text-2xl text-white font-bold">
                {interviewerName.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 font-medium">面接官</p>
            <p className="text-lg font-bold text-gray-900">{interviewerName}</p>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="mt-6 flex justify-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"></div>
          <div
            className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 rounded-full bg-pink-400 animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
