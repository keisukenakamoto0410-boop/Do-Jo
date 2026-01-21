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

// 初回のjoin通知のみ行う（ポーリングなし）
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

  const calledRef = useRef(false);

  useEffect(() => {
    // 1回だけ実行
    if (calledRef.current) return;
    calledRef.current = true;

    const joinOnce = async () => {
      try {
        const res = await fetch(`/api/reservations/${reservationId}/join`, {
          method: "POST",
        });

        if (res.ok) {
          const data = await res.json();
          setState({
            learnerJoined: data.learnerJoined,
            hostJoined: data.hostJoined,
            sessionStarted: data.sessionStarted,
            sessionStartedAt: data.sessionStartedAt ? new Date(data.sessionStartedAt) : null,
            isLoading: false,
            error: null,
          });

          if (data.sessionStarted || data.bothJoined) {
            onBothJoined?.();
          }
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    joinOnce();
  }, []); // 空の依存配列 - マウント時に1回だけ

  return {
    ...state,
    partnerJoined: isHost ? state.learnerJoined : state.hostJoined,
    iJoined: isHost ? state.hostJoined : state.learnerJoined,
  };
}
