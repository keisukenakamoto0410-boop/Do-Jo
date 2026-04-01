"use client";

import { useEffect, useState } from "react";

export default function DebugEnvPage() {
  const [clientLiffId, setClientLiffId] = useState<string>("Loading...");

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    setClientLiffId(liffId || "NOT FOUND");
    console.log("=== Environment Debug ===");
    console.log("NEXT_PUBLIC_LIFF_ID:", liffId);
    console.log("All NEXT_PUBLIC_ vars:", Object.keys(process.env).filter(k => k.startsWith("NEXT_PUBLIC_")));
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", maxWidth: "800px" }}>
      <h1 style={{ color: "#333" }}>Environment Variables Debug</h1>
      <div style={{ background: "#f5f5f5", padding: "15px", borderRadius: "8px", marginTop: "20px" }}>
        <p style={{ fontSize: "16px", margin: "10px 0" }}>
          <strong>NEXT_PUBLIC_LIFF_ID:</strong>{" "}
          <code style={{ background: clientLiffId === "NOT FOUND" ? "#ffebee" : "#e8f5e9", padding: "5px 10px", borderRadius: "4px" }}>
            {clientLiffId}
          </code>
        </p>
        <p style={{ fontSize: "14px", color: "#666", marginTop: "15px" }}>
          ✓ Open browser console (F12) to see detailed debug logs
        </p>
      </div>
      {clientLiffId === "NOT FOUND" && (
        <div style={{ background: "#fff3cd", border: "1px solid #ffc107", padding: "15px", borderRadius: "8px", marginTop: "20px" }}>
          <strong>⚠️ LIFF ID not found!</strong>
          <p>Possible causes:</p>
          <ul>
            <li>Environment variable not set in Vercel</li>
            <li>Build cache issue - try redeploying</li>
            <li>Typo in variable name</li>
          </ul>
        </div>
      )}
    </div>
  );
}
