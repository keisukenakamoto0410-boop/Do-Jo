"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SessionJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"validating" | "error" | "redirecting">(
    "validating"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("トークンが見つかりません");
      return;
    }

    validateAndRedirect(token);
  }, [token]);

  const validateAndRedirect = async (token: string) => {
    try {
      const response = await fetch("/api/session/validate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        if (response.status === 401) {
          setErrorMessage(
            "このリンクは無効または期限切れです。\nLINEの通知から再度アクセスしてください。"
          );
        } else {
          setErrorMessage("エラーが発生しました。もう一度お試しください。");
        }
        return;
      }

      setStatus("redirecting");

      // Redirect to appropriate session page based on role
      // Store token in sessionStorage for the session page to use
      sessionStorage.setItem("sessionToken", token);
      sessionStorage.setItem("sessionUserId", data.userId);
      sessionStorage.setItem("sessionReservationId", data.reservationId);

      // Redirect to session page based on role
      if (data.userRole === "senior") {
        router.replace(`/senior/session/${data.reservationId}?token=${token}`);
      } else {
        router.replace(`/learner/session/${data.reservationId}?token=${token}`);
      }
    } catch (error) {
      console.error("Token validation error:", error);
      setStatus("error");
      setErrorMessage("接続エラーが発生しました。もう一度お試しください。");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        {status === "validating" && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-500 border-t-transparent mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              認証中...
            </h1>
            <p className="text-gray-600">
              セッションへの接続を準備しています
            </p>
          </>
        )}

        {status === "redirecting" && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              接続中...
            </h1>
            <p className="text-gray-600">
              セッションページに移動しています
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              アクセスできません
            </h1>
            <p className="text-gray-700 whitespace-pre-line mb-8">
              {errorMessage}
            </p>
            <button
              onClick={() => window.close()}
              className="w-full py-4 bg-gray-200 text-gray-700 text-lg font-bold rounded-xl hover:bg-gray-300 transition-colors"
            >
              閉じる
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-500 border-t-transparent mx-auto mb-6"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          読み込み中...
        </h1>
      </div>
    </div>
  );
}

export default function SessionJoinPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SessionJoinContent />
    </Suspense>
  );
}
