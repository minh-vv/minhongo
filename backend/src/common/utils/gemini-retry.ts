import { Logger } from '@nestjs/common';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  logger?: Logger;
}

/**
 * Extracts the retry-after delay from a 429 error response.
 * Google Gemini API sometimes includes this in the error object or headers.
 */
function getRetryAfterMs(error: any): number | null {
  // Check for retryDelay in errorDetails (Google AI SDK format)
  if (error.errorDetails) {
    for (const detail of error.errorDetails) {
      if (detail.retryDelay) {
        // Parse "Xs" format (e.g., "30s")
        const match = String(detail.retryDelay).match(/(\d+)/);
        if (match) return parseInt(match[1], 10) * 1000;
      }
    }
  }

  // Check for retry-after header (standard HTTP)
  const retryAfter =
    error.headers?.['retry-after'] ?? error.response?.headers?.['retry-after'];
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) return seconds * 1000;
  }

  return null;
}

/**
 * Executes a function and retries it if it fails due to a transient error
 * (e.g., HTTP 503, HTTP 429, or network errors with no status code).
 *
 * For 429 (rate limit) errors:
 *  - Uses a longer initial delay (5s instead of 1s)
 *  - Respects Retry-After header if present
 *  - Allows up to 5 retries (vs 3 for other errors)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 1000;
  const backoffFactor = options.backoffFactor ?? 2;
  const logger = options.logger ?? new Logger('GeminiRetry');

  // For rate limit errors, we allow extra retries
  const maxRateLimitRetries = Math.max(maxRetries, 5);

  let delay = initialDelayMs;
  let rateLimitHits = 0;

  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error.status ?? error.statusCode;

      // Transient errors to retry:
      // - No status code (usually network errors, connection reset, timeout)
      // - 429 (Too Many Requests / rate limits)
      // - 5xx (Server errors, e.g., 503 Service Unavailable)
      // Do NOT retry 400, 401, 403, 404, etc.
      const isRateLimit = status === 429;
      const isRetryable =
        status === undefined ||
        status === null ||
        isRateLimit ||
        (status >= 500 && status < 600);

      const currentMaxRetries = isRateLimit
        ? maxRateLimitRetries
        : maxRetries;
      const isLastAttempt = attempt >= currentMaxRetries;

      if (isLastAttempt || !isRetryable) {
        throw error;
      }

      let finalDelay: number;

      if (isRateLimit) {
        rateLimitHits++;
        // Check for server-suggested retry delay
        const retryAfterMs = getRetryAfterMs(error);
        if (retryAfterMs) {
          finalDelay = retryAfterMs;
        } else {
          // Rate limit: start at 5s and increase aggressively
          const rateLimitDelay = 5000 * Math.pow(backoffFactor, rateLimitHits - 1);
          // Cap at 60 seconds
          finalDelay = Math.min(rateLimitDelay, 60000);
        }
        logger.warn(
          `🚦 Rate limited (429) by Gemini API (hit #${rateLimitHits}, attempt ${attempt}/${currentMaxRetries}). ` +
          `Waiting ${Math.round(finalDelay / 1000)}s before retry...`,
        );
      } else {
        // Non-rate-limit transient error: use standard backoff
        const jitter = (Math.random() * 0.4 - 0.2) * delay;
        finalDelay = Math.max(100, Math.round(delay + jitter));

        logger.warn(
          `Gemini API request failed (Attempt ${attempt}/${currentMaxRetries}, ` +
          `Status: ${status ?? 'Network Error'}). Retrying in ${finalDelay}ms... ` +
          `Error: ${error.message}`,
        );

        delay *= backoffFactor;
      }

      await new Promise((resolve) => setTimeout(resolve, finalDelay));
    }
  }
}
