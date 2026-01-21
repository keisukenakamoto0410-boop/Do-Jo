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

  // Refs for cleanup and state tracking
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorCountRef = useRef(0);
  const sessionStartedRef = useRef(false);
  const onBothJoinedRef = useRef(onBothJoined);

  // Keep callback ref updated
  useEffect(() => {
    onBothJoinedRef.current = onBothJoined;
  }, [onBothJoined]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Main effect
  useEffect(() => {
    mountedRef.current = true;
    errorCountRef.current = 0;
    sessionStartedRef.current = false;

    // Initial join request
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
            cleanup();
            onBothJoinedRef.current?.();
          }
        } else {
          throw new Error("Failed to join");
        }
      } catch (err) {
        console.error("[useSessionJoin] Join error:", err);
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: "接続に失敗しました",
          }));
        }
      }
    };

    // Poll for status
    const doPoll = async () => {
      if (!mountedRef.current || sessionStartedRef.current) {
        cleanup();
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
            cleanup();
            onBothJoinedRef.current?.();
          }
        } else {
          throw new Error("Poll failed");
        }
      } catch (err) {
        console.error("[useSessionJoin] Poll error:", err);
        errorCountRef.current++;

        if (errorCountRef.current >= MAX_ERRORS) {
          cleanup();
          if (mountedRef.current) {
            setState((prev) => ({
              ...prev,
              error: "接続に失敗しました。ページを更新してください。",
            }));
          }
        }
      }
    };

    // Start
    doJoin().then(() => {
      if (mountedRef.current && !sessionStartedRef.current) {
        // Only start polling if not already started
        if (!intervalRef.current) {
          intervalRef.current = setInterval(doPoll, POLL_INTERVAL);
        }
      }
    });

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [reservationId, cleanup]);

  return {
    ...state,
    partnerJoined: isHost ? state.learnerJoined : state.hostJoined,
    iJoined: isHost ? state.hostJoined : state.learnerJoined,
  };
}
