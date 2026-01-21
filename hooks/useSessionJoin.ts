"use client";

import { useState, useEffect, useRef } from "react";

interface UseSessionJoinProps {
  reservationId: string;
  isHost: boolean;
  onBothJoined?: () => void;
}

interface JoinState {
  learnerJoined: boolean;
  hostJoined: boolean;
  sessionStarted: boolean;
  sessionStartedAt: Date | null;
  isLoading: boolean;
  error: string | null;
}

const POLL_INTERVAL = 5000; // 5秒間隔
const MAX_ERRORS = 3; // 連続エラー3回で停止

export function useSessionJoin({
  reservationId,
  isHost,
  onBothJoined,
}: UseSessionJoinProps) {
  const [state, setState] = useState<JoinState>({
    learnerJoined: false,
    hostJoined: false,
    sessionStarted: false,
    sessionStartedAt: null,
    isLoading: true,
    error: null,
  });

  // すべてのrefを先に宣言
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorCountRef = useRef(0);
  const sessionStartedRef = useRef(false);
  const onBothJoinedRef = useRef(onBothJoined);
  const initializedRef = useRef(false);

  // コールバックrefを更新
  useEffect(() => {
    onBothJoinedRef.current = onBothJoined;
  }, [onBothJoined]);

  useEffect(() => {
    // 二重初期化防止
    if (initializedRef.current) return;
    initializedRef.current = true;

    mountedRef.current = true;
    errorCountRef.current = 0;
    sessionStartedRef.current = false;

    // クリーンアップ関数
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // 初回のjoinリクエスト
    const doJoin = async () => {
      if (!mountedRef.current) return;

      try {
        const res = await fetch(`/api/reservations/${reservationId}/join`, {
          method: "POST",
        });

        if (!mountedRef.current) return;

        if (res.ok) {
          const data = await res.json();
          errorCountRef.current = 0;

          setState({
            learnerJoined: data.learnerJoined,
            hostJoined: data.hostJoined,
            sessionStarted: data.sessionStarted,
            sessionStartedAt: data.sessionStartedAt
              ? new Date(data.sessionStartedAt)
              : null,
            isLoading: false,
            error: null,
          });

          if (data.sessionStarted || data.bothJoined) {
            sessionStartedRef.current = true;
            stopPolling();
            onBothJoinedRef.current?.();
            return true; // セッション開始済み
          }
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (err) {
        console.error("[useSessionJoin] Join error:", err);
        errorCountRef.current++;
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: "接続に失敗しました",
          }));
        }
      }
      return false;
    };

    // ポーリング
    const doPoll = async () => {
      // ポーリング停止条件をチェック
      if (!mountedRef.current || sessionStartedRef.current) {
        stopPolling();
        return;
      }

      try {
        const res = await fetch(`/api/reservations/${reservationId}/join`);

        if (!mountedRef.current) return;

        if (res.ok) {
          const data = await res.json();
          errorCountRef.current = 0;

          setState({
            learnerJoined: data.learnerJoined,
            hostJoined: data.hostJoined,
            sessionStarted: data.sessionStarted,
            sessionStartedAt: data.sessionStartedAt
              ? new Date(data.sessionStartedAt)
              : null,
            isLoading: false,
            error: null,
          });

          if (data.sessionStarted) {
            sessionStartedRef.current = true;
            stopPolling();
            onBothJoinedRef.current?.();
          }
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (err) {
        console.error("[useSessionJoin] Poll error:", err);
        errorCountRef.current++;

        // 3回連続エラーでポーリング停止
        if (errorCountRef.current >= MAX_ERRORS) {
          console.error("[useSessionJoin] Max errors reached, stopping polling");
          stopPolling();
          if (mountedRef.current) {
            setState((prev) => ({
              ...prev,
              error: "接続に失敗しました。ページを更新してください。",
            }));
          }
        }
      }
    };

    // 初期化
    doJoin().then((sessionStarted) => {
      // セッションが既に開始されていたらポーリングしない
      if (sessionStarted || !mountedRef.current || sessionStartedRef.current) {
        return;
      }

      // ポーリング開始（重複防止）
      if (!intervalRef.current) {
        console.log("[useSessionJoin] Starting polling with interval:", POLL_INTERVAL);
        intervalRef.current = setInterval(doPoll, POLL_INTERVAL);
      }
    });

    // クリーンアップ
    return () => {
      console.log("[useSessionJoin] Cleanup");
      mountedRef.current = false;
      initializedRef.current = false;
      stopPolling();
    };
  }, [reservationId]); // reservationIdのみ依存

  return {
    ...state,
    partnerJoined: isHost ? state.learnerJoined : state.hostJoined,
    iJoined: isHost ? state.hostJoined : state.learnerJoined,
  };
}
