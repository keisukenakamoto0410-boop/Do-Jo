"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabase } from "@/lib/supabase";

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

  // 入室状態をポーリングで確認（Supabase Realtimeの代わり）
  const checkJoinStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/join`);
      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          learnerJoined: data.learnerJoined,
          hostJoined: data.hostJoined,
          sessionStarted: data.sessionStarted,
          sessionStartedAt: data.sessionStartedAt ? new Date(data.sessionStartedAt) : null,
          isLoading: false,
        }));

        // 両者が入室したらコールバック
        if (data.sessionStarted && !hasCalledOnBothJoined.current) {
          hasCalledOnBothJoined.current = true;
          onBothJoined?.();
        }

        return data.sessionStarted;
      }
    } catch (err) {
      console.error("Failed to check join status:", err);
    }
    return false;
  }, [reservationId, onBothJoined]);

  // 入室を通知
  const joinSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/join`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          learnerJoined: data.learnerJoined,
          hostJoined: data.hostJoined,
          sessionStarted: data.sessionStarted,
          sessionStartedAt: data.sessionStartedAt ? new Date(data.sessionStartedAt) : null,
        }));

        if (data.bothJoined && !hasCalledOnBothJoined.current) {
          hasCalledOnBothJoined.current = true;
          onBothJoined?.();
        }

        return data;
      }
    } catch (err) {
      console.error("Failed to join session:", err);
      setState((prev) => ({ ...prev, error: "Failed to join session" }));
    }
    return null;
  }, [reservationId, onBothJoined]);

  // 初回入室処理とポーリング開始
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    const init = async () => {
      // 入室を通知
      await joinSession();

      // セッションが開始されるまでポーリング
      pollInterval = setInterval(async () => {
        const started = await checkJoinStatus();
        if (started && pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }, 2000); // 2秒ごとにチェック
    };

    init();

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [joinSession, checkJoinStatus]);

  // Supabase Realtimeでリアルタイム更新を購読
  useEffect(() => {
    const supabase = getSupabase();

    const channel = supabase
      .channel(`session-join-${reservationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reservations",
          filter: `id=eq.${reservationId}`,
        },
        (payload) => {
          const newData = payload.new as {
            learnerJoinedAt: string | null;
            hostJoinedAt: string | null;
            sessionStartedAt: string | null;
          };

          const sessionStarted = !!newData.sessionStartedAt;

          setState((prev) => ({
            ...prev,
            learnerJoined: !!newData.learnerJoinedAt,
            hostJoined: !!newData.hostJoinedAt,
            sessionStarted,
            sessionStartedAt: newData.sessionStartedAt
              ? new Date(newData.sessionStartedAt)
              : null,
          }));

          if (sessionStarted && !hasCalledOnBothJoined.current) {
            hasCalledOnBothJoined.current = true;
            onBothJoined?.();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reservationId, onBothJoined]);

  return {
    ...state,
    partnerJoined: isHost ? state.learnerJoined : state.hostJoined,
    iJoined: isHost ? state.hostJoined : state.learnerJoined,
  };
}
