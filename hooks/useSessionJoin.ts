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

const POLL_INTERVAL = 6000; // 6秒間隔
const MAX_RETRIES = 3; // 最大リトライ回数

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

  const hasCalledOnBothJoined = useRef(false);
  const retryCountRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isPollingRef = useRef(false);

  // ポーリングを停止する関数
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    isPollingRef.current = false;
  };

  // 入室状態をチェック
  const checkJoinStatus = async (): Promise<boolean> => {
    if (!isMountedRef.current) return false;

    try {
      const res = await fetch(`/api/reservations/${reservationId}/join`);

      if (!isMountedRef.current) return false;

      if (res.ok) {
        const data = await res.json();

        // リトライカウントをリセット
        retryCountRef.current = 0;

        setState((prev) => ({
          ...prev,
          learnerJoined: data.learnerJoined,
          hostJoined: data.hostJoined,
          sessionStarted: data.sessionStarted,
          sessionStartedAt: data.sessionStartedAt ? new Date(data.sessionStartedAt) : null,
          isLoading: false,
          error: null,
        }));

        // 両者が入室したらコールバック & ポーリング停止
        if (data.sessionStarted) {
          if (!hasCalledOnBothJoined.current) {
            hasCalledOnBothJoined.current = true;
            onBothJoined?.();
          }
          stopPolling();
          return true;
        }

        return false;
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to check join status:", err);
      retryCountRef.current++;

      if (retryCountRef.current >= MAX_RETRIES) {
        stopPolling();
        setState((prev) => ({
          ...prev,
          error: "接続に失敗しました。ページを更新してください。",
          isLoading: false,
        }));
      }
      return false;
    }
  };

  // 入室を通知
  const joinSession = async (): Promise<boolean> => {
    if (!isMountedRef.current) return false;

    try {
      const res = await fetch(`/api/reservations/${reservationId}/join`, {
        method: "POST",
      });

      if (!isMountedRef.current) return false;

      if (res.ok) {
        const data = await res.json();

        setState((prev) => ({
          ...prev,
          learnerJoined: data.learnerJoined,
          hostJoined: data.hostJoined,
          sessionStarted: data.sessionStarted,
          sessionStartedAt: data.sessionStartedAt ? new Date(data.sessionStartedAt) : null,
          isLoading: false,
          error: null,
        }));

        if (data.bothJoined || data.sessionStarted) {
          if (!hasCalledOnBothJoined.current) {
            hasCalledOnBothJoined.current = true;
            onBothJoined?.();
          }
          return true;
        }

        return false;
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to join session:", err);
      setState((prev) => ({
        ...prev,
        error: "セッションへの参加に失敗しました。",
        isLoading: false
      }));
      return false;
    }
  };

  // 初回入室処理とポーリング開始
  useEffect(() => {
    isMountedRef.current = true;
    retryCountRef.current = 0;
    hasCalledOnBothJoined.current = false;

    const init = async () => {
      // 入室を通知
      const sessionStarted = await joinSession();

      // セッションが既に開始されていたらポーリング不要
      if (sessionStarted || !isMountedRef.current) return;

      // 既にポーリング中なら開始しない
      if (isPollingRef.current) return;
      isPollingRef.current = true;

      // セッションが開始されるまでポーリング
      pollIntervalRef.current = setInterval(async () => {
        if (!isMountedRef.current || retryCountRef.current >= MAX_RETRIES) {
          stopPolling();
          return;
        }

        await checkJoinStatus();
      }, POLL_INTERVAL);
    };

    init();

    // クリーンアップ
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [reservationId]); // reservationIdのみに依存

  return {
    ...state,
    partnerJoined: isHost ? state.learnerJoined : state.hostJoined,
    iJoined: isHost ? state.hostJoined : state.learnerJoined,
  };
}
