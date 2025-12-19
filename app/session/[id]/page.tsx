"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SessionRedirect() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const reservationId = params.id as string;

  useEffect(() => {
    console.log("Session redirect - Status:", status);
    console.log("Session redirect - User role:", session?.user?.role);
    console.log("Session redirect - Reservation ID:", reservationId);

    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    // ロールに応じて適切なセッションページにリダイレクト
    if (session.user?.role === "learner") {
      router.replace(`/learner/session/${reservationId}`);
    } else {
      router.replace(`/host/session/${reservationId}`);
    }
  }, [session, status, reservationId, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-xl">Redirecting to session...</p>
        <p className="text-gray-400 text-sm mt-2">
          Status: {status} | Role: {session?.user?.role || "loading..."}
        </p>
      </div>
    </div>
  );
}
