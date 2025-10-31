import React from "react";
import Button from "./Button";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: "inline" | "card" | "banner";
  severity?: "error" | "warning" | "info";
}

export default function ErrorMessage({
  title,
  message,
  onRetry,
  onDismiss,
  variant = "inline",
  severity = "error",
}: ErrorMessageProps) {
  const severityConfig = {
    error: {
      icon: "❌",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
      titleColor: "text-red-900",
      buttonColor: "danger" as const,
    },
    warning: {
      icon: "⚠️",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-800",
      titleColor: "text-yellow-900",
      buttonColor: "primary" as const,
    },
    info: {
      icon: "ℹ️",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      titleColor: "text-blue-900",
      buttonColor: "primary" as const,
    },
  };

  const config = severityConfig[severity];

  if (variant === "banner") {
    return (
      <div
        className={`${config.bgColor} border-l-4 ${config.borderColor} p-4 mb-4`}
        role="alert"
      >
        <div className="flex items-start">
          <span className="text-2xl mr-3">{config.icon}</span>
          <div className="flex-1">
            {title && (
              <h3 className={`font-bold ${config.titleColor} mb-1`}>{title}</h3>
            )}
            <p className={`text-sm ${config.textColor}`}>{message}</p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`ml-4 ${config.textColor} hover:opacity-70`}
              aria-label="閉じる"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={`${config.bgColor} border ${config.borderColor} rounded-lg p-6 text-center`}
        role="alert"
      >
        <div className="text-5xl mb-4">{config.icon}</div>
        {title && (
          <h3 className={`text-xl font-bold ${config.titleColor} mb-2`}>
            {title}
          </h3>
        )}
        <p className={`${config.textColor} mb-4`}>{message}</p>
        {(onRetry || onDismiss) && (
          <div className="flex justify-center space-x-3">
            {onRetry && (
              <Button variant={config.buttonColor} onClick={onRetry} size="sm">
                再試行
              </Button>
            )}
            {onDismiss && (
              <Button variant="outline" onClick={onDismiss} size="sm">
                閉じる
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Inline variant (default)
  return (
    <div
      className={`${config.bgColor} border ${config.borderColor} rounded-md p-3 text-sm ${config.textColor}`}
      role="alert"
    >
      <div className="flex items-start">
        <span className="mr-2">{config.icon}</span>
        <div className="flex-1">
          {title && <strong className="font-semibold mr-1">{title}</strong>}
          <span>{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-3 underline hover:opacity-70 whitespace-nowrap"
          >
            再試行
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Form Error - For inline form errors
 */
interface FormErrorProps {
  message: string;
  className?: string;
}

export function FormError({ message, className = "" }: FormErrorProps) {
  if (!message) return null;

  return (
    <p className={`text-sm text-red-600 mt-1 flex items-center ${className}`}>
      <span className="mr-1">⚠</span>
      {message}
    </p>
  );
}

/**
 * Empty State - For when there's no data
 */
interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
