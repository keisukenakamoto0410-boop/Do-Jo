"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Application error:", error);

    // TODO: Log to error tracking service (Sentry, etc.)
    // logErrorToService(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Error Icon */}
        <div className="text-6xl mb-4">😔</div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          エラーが発生しました
        </h1>

        {/* Error Description */}
        <p className="text-gray-600 mb-6">
          申し訳ございません。予期しないエラーが発生しました。
          <br />
          もう一度お試しください。
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-xs font-mono text-red-800 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          <Button variant="primary" onClick={reset} fullWidth>
            もう一度試す
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            fullWidth
          >
            ホームに戻る
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-sm text-gray-500 mt-6">
          問題が解決しない場合は、
          <a
            href="mailto:support@dojo-platform.com"
            className="text-blue-600 hover:underline ml-1"
          >
            サポートにお問い合わせください
          </a>
        </p>
      </div>
    </div>
  );
}
