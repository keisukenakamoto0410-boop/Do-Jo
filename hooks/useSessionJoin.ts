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

const POLL_INTERVAL = 10000; // 10秒間隔

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

  const intervalIdRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;

    const stopPolling = () => {
      stoppedRef.current = true;
      if (intervalIdRef.current !== null) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };

    const fetchJoinStatus = async (isPost: boolean) => {
      if (stoppedRef.current) return;

      try {
        const res = await fetch(`/api/reservations/${reservationId}/join`, {
          method: isPost ? "POST" : "GET",
        });

        if (stoppedRef.current) return;

        if (!res.ok) {
          // エラー時は即座に停止
          stopPolling();
          setState(prev => ({ ...prev, isLoading: false, error: "接続エラー" }));
          return;
        }

        const data = await res.json();

        setState({
          learnerJoined: data.learnerJoined,
          hostJoined: data.hostJoined,
          sessionStarted: data.sessionStarted,
          sessionStartedAt: data.sessionStartedAt ? new Date(data.sessionStartedAt) : null,
          isLoading: false,
          error: null,
        });

        // セッション開始したらポーリング停止
        if (data.sessionStarted || data.bothJoined) {
          stopPolling();
          onBothJoined?.();
        }
      } catch {
        // エラー時は即座に停止
        stopPolling();
        setState(prev => ({ ...prev, isLoading: false, error: "接続エラー" }));
      }
    };

    // 初回POST
    fetchJoinStatus(true).then(() => {
      if (stoppedRef.current) return;

      // ポーリング開始
      intervalIdRef.current = window.setInterval(() => {
        if (!stoppedRef.current) {
          fetchJoinStatus(false);
        }
      }, POLL_INTERVAL);
    });

    // クリーンアップ
    return () => {
      stopPolling();
    };
  }, [reservationId]);

  return {
    ...state,
    partnerJoined: isHost ? state.learnerJoined : state.hostJoined,
    iJoined: isHost ? state.hostJoined : state.learnerJoined,
  };
}
