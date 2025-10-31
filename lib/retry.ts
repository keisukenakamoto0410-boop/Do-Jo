/**
 * Retry Utilities
 *
 * Provides retry logic for failed operations with exponential backoff.
 */

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise that resolves with the result or rejects after max attempts
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        break;
      }

      // Call onRetry callback
      if (onRetry) {
        onRetry(attempt, error);
      }

      // Log retry attempt
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`, error);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay with backoff factor
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  // All attempts failed
  throw lastError;
}

/**
 * Retry a fetch request
 *
 * @param url URL to fetch
 * @param init Fetch init options
 * @param options Retry options
 * @returns Promise that resolves with the response
 */
export async function retryFetch(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, init);

    // Only retry on network errors or 5xx server errors
    if (!response.ok && response.status >= 500) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }, options);
}

/**
 * Determine if an error is retryable
 *
 * @param error Error to check
 * @returns True if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return true;
  }

  // Timeout errors
  if (error.name === "AbortError") {
    return true;
  }

  // HTTP status codes that are retryable
  if (error.response) {
    const status = error.response.status;
    // 408: Request Timeout
    // 429: Too Many Requests
    // 500-599: Server errors
    return status === 408 || status === 429 || (status >= 500 && status < 600);
  }

  return false;
}

/**
 * Upload file with retry logic
 *
 * @param file File to upload
 * @param url Upload URL
 * @param options Retry options
 * @returns Promise that resolves with the upload response
 */
export async function uploadWithRetry(
  file: File,
  url: string,
  options?: RetryOptions & { onProgress?: (progress: number) => void }
): Promise<Response> {
  const { onProgress, ...retryOptions } = options || {};

  return retryWithBackoff(async () => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    return new Promise<Response>((resolve, reject) => {
      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Create a Response-like object
          const response = new Response(xhr.response, {
            status: xhr.status,
            statusText: xhr.statusText,
          });
          resolve(response);
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload aborted"));
      });

      xhr.open("POST", url);
      xhr.send(formData);
    });
  }, retryOptions);
}

/**
 * Retry button component helper
 * Returns props to spread on a retry button
 */
export function getRetryButtonProps(
  onRetry: () => void,
  isRetrying: boolean = false
) {
  return {
    onClick: onRetry,
    disabled: isRetrying,
    children: isRetrying ? "再試行中..." : "再試行",
  };
}

export default {
  retryWithBackoff,
  retryFetch,
  isRetryableError,
  uploadWithRetry,
  getRetryButtonProps,
};
