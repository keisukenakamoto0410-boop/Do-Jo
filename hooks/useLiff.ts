// hooks/useLiff.ts
// LIFFの初期化とログイン機能を提供するカスタムフック

import { useState, useEffect } from "react";
import liff from "@line/liff";

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface UseLiffReturn {
  isReady: boolean;
  isLoggedIn: boolean;
  profile: LiffProfile | null;
  error: string | null;
  login: () => void;
  logout: () => void;
}

export function useLiff(): UseLiffReturn {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    // デバッグ用ログ
    console.log("[LIFF] ===== LIFF Initialization Start =====");
    console.log("[LIFF] Environment check:", {
      liffId: liffId ? "Found" : "Not found",
      value: liffId,
      allEnvVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
    });
    console.log("[LIFF] Current URL:", window.location.href);

    if (!liffId) {
      const errorMsg = "LIFF ID is not configured. Please set NEXT_PUBLIC_LIFF_ID environment variable.";
      console.error("[LIFF]", errorMsg);
      setError(errorMsg);
      return;
    }

    // LIFFの初期化
    console.log("[LIFF] Calling liff.init() with LIFF ID:", liffId);
    liff
      .init({ liffId })
      .then(() => {
        console.log("[LIFF] ✓ Initialized successfully");
        console.log("[LIFF] Context:", liff.getContext());
        console.log("[LIFF] Is in client:", liff.isInClient());
        console.log("[LIFF] OS:", liff.getOS());
        console.log("[LIFF] Language:", liff.getLanguage());

        // アクセストークンの存在を確認
        try {
          const accessToken = liff.getAccessToken();
          console.log("[LIFF] Access token exists:", !!accessToken);
          if (accessToken) {
            console.log("[LIFF] Access token (first 20 chars):", accessToken.substring(0, 20) + "...");
          }
        } catch (err) {
          console.log("[LIFF] Could not get access token:", err);
        }

        setIsReady(true);

        // ログイン状態をチェック
        const loggedIn = liff.isLoggedIn();
        console.log("[LIFF] isLoggedIn() result:", loggedIn);

        if (loggedIn) {
          console.log("[LIFF] ✓ User is already logged in");
          setIsLoggedIn(true);

          // プロフィール情報を取得
          liff
            .getProfile()
            .then((profile) => {
              console.log("[LIFF] ✓ Profile retrieved:", profile);
              setProfile(profile);
            })
            .catch((err) => {
              console.error("[LIFF] ✗ Failed to get profile:", err);
              console.error("[LIFF] Error details:", {
                message: err.message,
                stack: err.stack,
                code: err.code
              });
              setError(`Failed to get profile: ${err.message || "Unknown error"}`);
            });
        } else {
          console.log("[LIFF] User is not logged in - waiting for user action");
        }
        console.log("[LIFF] ===== LIFF Initialization Complete =====");
      })
      .catch((err) => {
        console.error("[LIFF] ✗ Initialization failed");
        console.error("[LIFF] Error object:", err);
        console.error("[LIFF] Error details:", {
          message: err.message,
          stack: err.stack,
          code: err.code,
          name: err.name
        });
        setError(`Failed to initialize LIFF: ${err.message || "Unknown error"}. Check console for details.`);
      });
  }, []);

  const login = () => {
    console.log("[LIFF] ===== Login Process Start =====");
    console.log("[LIFF] isReady:", isReady);
    console.log("[LIFF] isLoggedIn:", isLoggedIn);

    if (!isReady) {
      const warnMsg = "LIFF is not ready yet. Please wait for initialization to complete.";
      console.warn("[LIFF]", warnMsg);
      setError(warnMsg);
      return;
    }

    try {
      console.log("[LIFF] Calling liff.login()...");
      console.log("[LIFF] Current location:", window.location.href);

      // LIFFのログインページにリダイレクト
      // クエリパラメータを削除したクリーンなURLを使用
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      console.log("[LIFF] Redirect URI:", redirectUri);

      liff.login({
        redirectUri: redirectUri
      });

      console.log("[LIFF] Login redirect initiated");
    } catch (err) {
      console.error("[LIFF] ✗ Login failed:", err);
      console.error("[LIFF] Error details:", {
        message: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
        code: (err as any).code,
        name: err instanceof Error ? err.name : undefined
      });
      setError(`Login failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const logout = () => {
    if (!isReady) {
      console.warn("[LIFF] LIFF is not ready yet");
      return;
    }

    try {
      liff.logout();
      setIsLoggedIn(false);
      setProfile(null);
      window.location.reload();
    } catch (err) {
      console.error("[LIFF] Logout failed:", err);
      setError("Logout failed");
    }
  };

  return {
    isReady,
    isLoggedIn,
    profile,
    error,
    login,
    logout,
  };
}
