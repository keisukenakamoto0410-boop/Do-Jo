/**
 * Toast Notification Utilities
 *
 * Wrapper around react-hot-toast with consistent styling and Japanese messages.
 * Usage:
 *   import { toast } from '@/lib/toast';
 *   toast.success('成功しました！');
 *   toast.error('エラーが発生しました');
 */

import toastLib, { ToastOptions, Renderable } from "react-hot-toast";

// Default toast options
const defaultOptions: ToastOptions = {
  duration: 4000,
  position: "top-right",
  style: {
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
  },
};

// Success toast
function success(message: Renderable, options?: ToastOptions) {
  return toastLib.success(message, {
    ...defaultOptions,
    ...options,
    icon: "✅",
    style: {
      ...defaultOptions.style,
      background: "#10b981",
      color: "#fff",
      ...options?.style,
    },
  });
}

// Error toast
function error(message: Renderable, options?: ToastOptions) {
  return toastLib.error(message, {
    ...defaultOptions,
    ...options,
    duration: 5000, // Longer for errors
    icon: "❌",
    style: {
      ...defaultOptions.style,
      background: "#ef4444",
      color: "#fff",
      ...options?.style,
    },
  });
}

// Info toast
function info(message: Renderable, options?: ToastOptions) {
  return toastLib(message, {
    ...defaultOptions,
    ...options,
    icon: "ℹ️",
    style: {
      ...defaultOptions.style,
      background: "#3b82f6",
      color: "#fff",
      ...options?.style,
    },
  });
}

// Warning toast
function warning(message: Renderable, options?: ToastOptions) {
  return toastLib(message, {
    ...defaultOptions,
    ...options,
    icon: "⚠️",
    style: {
      ...defaultOptions.style,
      background: "#f59e0b",
      color: "#fff",
      ...options?.style,
    },
  });
}

// Loading toast
function loading(message: Renderable, options?: ToastOptions) {
  return toastLib.loading(message, {
    ...defaultOptions,
    ...options,
    style: {
      ...defaultOptions.style,
      background: "#6b7280",
      color: "#fff",
      ...options?.style,
    },
  });
}

// Promise toast - shows loading, then success/error
function promise<T>(
  promise: Promise<T>,
  messages: {
    loading: Renderable;
    success: Renderable | ((data: T) => Renderable);
    error: Renderable | ((error: any) => Renderable);
  },
  options?: ToastOptions
) {
  return toastLib.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      ...defaultOptions,
      ...options,
      success: {
        icon: "✅",
        style: {
          background: "#10b981",
          color: "#fff",
        },
      },
      error: {
        icon: "❌",
        style: {
          background: "#ef4444",
          color: "#fff",
        },
      },
    }
  );
}

// Custom toast
function custom(message: Renderable, options?: ToastOptions) {
  return toastLib(message, {
    ...defaultOptions,
    ...options,
  });
}

// Dismiss all toasts
function dismiss(toastId?: string) {
  return toastLib.dismiss(toastId);
}

// Remove a specific toast
function remove(toastId: string) {
  return toastLib.remove(toastId);
}

// Export toast object with all methods
export const toast = {
  success,
  error,
  info,
  warning,
  loading,
  promise,
  custom,
  dismiss,
  remove,
};

// Common toast messages in Japanese
export const toastMessages = {
  // Success messages
  saved: "保存しました",
  updated: "更新しました",
  deleted: "削除しました",
  submitted: "送信しました",
  created: "作成しました",
  uploaded: "アップロードしました",
  copied: "コピーしました",

  // Error messages
  error: "エラーが発生しました",
  saveFailed: "保存に失敗しました",
  updateFailed: "更新に失敗しました",
  deleteFailed: "削除に失敗しました",
  submitFailed: "送信に失敗しました",
  uploadFailed: "アップロードに失敗しました",
  networkError: "ネットワークエラーが発生しました",
  unauthorized: "認証が必要です",
  forbidden: "アクセス権限がありません",
  notFound: "データが見つかりません",
  validationError: "入力内容を確認してください",

  // Loading messages
  saving: "保存中...",
  loading: "読み込み中...",
  uploading: "アップロード中...",
  processing: "処理中...",
  deleting: "削除中...",

  // Info messages
  copied: "クリップボードにコピーしました",
  sessionExpired: "セッションが期限切れです。再度ログインしてください",
  noChanges: "変更はありません",
};

// Helper to show API error
export function showApiError(error: any) {
  const message = error?.response?.data?.error || error?.message || toastMessages.error;
  toast.error(message);
}

// Helper to show validation errors
export function showValidationErrors(errors: Record<string, string>) {
  Object.values(errors).forEach((error) => {
    toast.error(error);
  });
}

export default toast;
