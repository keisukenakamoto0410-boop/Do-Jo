"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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

// sessionStartedAtが取得できるまでポーリング
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

  const onBothJoinedRef = useRef(onBothJoined);
  onBothJoinedRef.current = onBothJoined;

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const joinAndCheck = async () => {
      try {
        // Get session token from sessionStorage if available (for LINE users)
        const sessionToken = typeof window !== 'undefined' ? sessionStorage.getItem('sessionToken') : null;

        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (sessionToken) {
          headers['Authorization'] = `Bearer ${sessionToken}`;
        }

        const res = await fetch(`/api/reservations/${reservationId}/join`, {
          method: "POST",
          headers,
          body: JSON.stringify({ isHost }),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setState({
              learnerJoined: data.learnerJoined,
              hostJoined: data.hostJoined,
              sessionStarted: data.sessionStarted,
              sessionStartedAt: data.sessionStartedAt ? new Date(data.sessionStartedAt) : null,
              isLoading: false,
              error: null,
            });

            // 両者入室したらポーリング停止
            if (data.sessionStarted && data.sessionStartedAt) {
              if (intervalId) clearInterval(intervalId);
              onBothJoinedRef.current?.();
            }
          }
        } else {
          if (isMounted) {
            setState(prev => ({ ...prev, isLoading: false }));
          }
        }
      } catch (error) {
        console.error("Join error:", error);
        if (isMounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    // 初回実行
    joinAndCheck();

    // sessionStartedAtが取得できるまで3秒ごとにチェック
    intervalId = setInterval(joinAndCheck, 3000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [reservationId, isHost]);

  return {
    ...state,
    partnerJoined: isHost ? state.learnerJoined : state.hostJoined,
    iJoined: isHost ? state.hostJoined : state.learnerJoined,
  };
}
