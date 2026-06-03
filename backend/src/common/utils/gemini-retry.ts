import { Logger } from '@nestjs/common';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  logger?: Logger;
}

/**
 * Executes a function and retries it if it fails due to a transient error
 * (e.g., HTTP 503, HTTP 429, or network errors with no status code).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 1000;
  const backoffFactor = options.backoffFactor ?? 2;
  const logger = options.logger ?? new Logger('GeminiRetry');

  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const status = error.status;

      // Transient errors to retry:
      // - No status code (usually network errors, connection reset, timeout)
      // - 429 (Too Many Requests / rate limits)
      // - 5xx (Server errors, e.g., 503 Service Unavailable)
      // Do NOT retry 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), etc.
      const isRetryable =
        status === undefined ||
        status === null ||
        status === 429 ||
        (status >= 500 && status < 600);

      if (isLastAttempt || !isRetryable) {
        throw error;
      }

      // Add random jitter to prevent "thundering herd" problem
      // Jitter range: -20% to +20% of current delay
      const jitter = (Math.random() * 0.4 - 0.2) * delay;
      const finalDelay = Math.max(100, Math.round(delay + jitter));

      logger.warn(
        `Gemini API request failed (Attempt ${attempt}/${maxRetries}, Status: ${status ?? 'Network Error'}). Retrying in ${finalDelay}ms... Error: ${error.message}`,
      );

      await new Promise((resolve) => setTimeout(resolve, finalDelay));
      delay *= backoffFactor;
    }
  }

  throw new Error('Retry limit reached'); // Should be unreachable
}
