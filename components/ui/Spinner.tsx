import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "white" | "gray";
  className?: string;
}

export default function Spinner({
  size = "md",
  color = "primary",
  className = "",
}: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
    xl: "h-16 w-16 border-4",
  };

  const colorClasses = {
    primary: "border-blue-200 border-t-blue-600",
    secondary: "border-purple-200 border-t-purple-600",
    white: "border-gray-200 border-t-white",
    gray: "border-gray-300 border-t-gray-700",
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">読み込み中...</span>
    </div>
  );
}

/**
 * Centered Spinner - For full page/section loading
 */
interface CenteredSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  fullScreen?: boolean;
}

export function CenteredSpinner({
  size = "lg",
  text = "読み込み中...",
  fullScreen = false,
}: CenteredSpinnerProps) {
  const containerClass = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50"
    : "flex items-center justify-center p-12";

  return (
    <div className={containerClass}>
      <div className="text-center">
        <Spinner size={size} color="primary" className="mx-auto" />
        {text && <p className="mt-4 text-gray-600">{text}</p>}
      </div>
    </div>
  );
}
