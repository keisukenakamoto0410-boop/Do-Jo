"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";

interface UseSlidesSyncProps {
  reservationId: string;
  isHost: boolean;
  initialSlide?: number;
  initialTopic?: string;
}

interface SlideState {
  currentSlide: number;
  slideTopic: string | null;
}

export function useSlideSync({
  reservationId,
  isHost,
  initialSlide = 1,
  initialTopic,
}: UseSlidesSyncProps) {
  const [slideState, setSlideState] = useState<SlideState>({
    currentSlide: initialSlide,
    slideTopic: initialTopic || null,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初期データを取得
  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const response = await fetch(
          `/api/slide-session?reservationId=${reservationId}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.slideSession) {
            setSlideState({
              currentSlide: data.slideSession.currentSlide,
              slideTopic: data.slideSession.slideTopic,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial slide state:", err);
      }
    };

    fetchInitialState();
  }, [reservationId]);

  // Supabase Realtimeで同期（ホスト側）
  useEffect(() => {
    if (!isHost) return;

    const supabase = getSupabase();

    const channel = supabase
      .channel(`slide-session-${reservationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "slide_sessions",
          filter: `reservationId=eq.${reservationId}`,
        },
        (payload) => {
          console.log("Slide sync received:", payload);
          const newData = payload.new as {
            currentSlide: number;
            slideTopic: string | null;
          };
          setSlideState({
            currentSlide: newData.currentSlide,
            slideTopic: newData.slideTopic,
          });
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        setIsConnected(status === "SUBSCRIBED");
        if (status === "CHANNEL_ERROR") {
          setError("Failed to connect to realtime sync");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reservationId, isHost]);

  // スライドを変更（学習者側）
  const changeSlide = useCallback(
    async (slideIndex: number) => {
      if (isHost) return; // ホストは操作不可

      setSlideState((prev) => ({ ...prev, currentSlide: slideIndex }));

      try {
        const response = await fetch("/api/slide-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservationId,
            currentSlide: slideIndex,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update slide");
        }
      } catch (err) {
        console.error("Failed to sync slide:", err);
        setError("Failed to sync slide");
      }
    },
    [reservationId, isHost]
  );

  // トピックを設定（学習者側）
  const setTopic = useCallback(
    async (topic: string) => {
      if (isHost) return;

      setSlideState((prev) => ({ ...prev, slideTopic: topic, currentSlide: 1 }));

      try {
        const response = await fetch("/api/slide-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservationId,
            slideTopic: topic,
            currentSlide: 1,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to set topic");
        }
      } catch (err) {
        console.error("Failed to set topic:", err);
        setError("Failed to set topic");
      }
    },
    [reservationId, isHost]
  );

  return {
    currentSlide: slideState.currentSlide,
    slideTopic: slideState.slideTopic,
    changeSlide,
    setTopic,
    isConnected,
    error,
  };
}
