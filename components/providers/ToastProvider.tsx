"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{}}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "14px",
        },
        // Success
        success: {
          duration: 3000,
          style: {
            background: "#10b981",
            color: "#fff",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#10b981",
          },
        },
        // Error
        error: {
          duration: 5000,
          style: {
            background: "#ef4444",
            color: "#fff",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#ef4444",
          },
        },
        // Loading
        loading: {
          style: {
            background: "#6b7280",
            color: "#fff",
          },
        },
      }}
    />
  );
}
