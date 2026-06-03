/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { withRetry } from './gemini-retry';

describe('withRetry', () => {
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(() => {
    loggerMock = {
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as unknown as jest.Mocked<Logger>;
  });

  it('should return result on first attempt if successful', async () => {
    const fn = jest.fn().mockResolvedValue('success-val');

    const result = await withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 1,
      logger: loggerMock,
    });

    expect(result).toBe('success-val');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it('should retry on transient error (e.g. 503) and succeed if subsequent attempt succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce({ status: 503, message: 'Service Unavailable' })
      .mockResolvedValueOnce('success-val');

    const result = await withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 1,
      logger: loggerMock,
    });

    expect(result).toBe('success-val');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(loggerMock.warn).toHaveBeenCalledTimes(1);
    expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.stringContaining('Attempt 1/3, Status: 503'),
    );
  });

  it('should retry on network error (no status) and succeed if subsequent attempt succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network connection lost'))
      .mockResolvedValueOnce('success-val');

    const result = await withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 1,
      logger: loggerMock,
    });

    expect(result).toBe('success-val');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(loggerMock.warn).toHaveBeenCalledTimes(1);
    expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.stringContaining('Attempt 1/3, Status: Network Error'),
    );
  });

  it('should retry on rate limit error (429) and succeed if subsequent attempt succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce({ status: 429, message: 'Too Many Requests' })
      .mockResolvedValueOnce('success-val');

    const result = await withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 1,
      logger: loggerMock,
    });

    expect(result).toBe('success-val');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(loggerMock.warn).toHaveBeenCalledTimes(1);
    expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.stringContaining('Attempt 1/3, Status: 429'),
    );
  });

  it('should not retry on non-retryable error (e.g., 400 Bad Request) and throw immediately', async () => {
    const fn = jest
      .fn()
      .mockRejectedValue({ status: 400, message: 'Bad Request' });

    await expect(
      withRetry(fn, { maxRetries: 3, initialDelayMs: 1, logger: loggerMock }),
    ).rejects.toEqual({ status: 400, message: 'Bad Request' });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it('should fail and throw last error if all retries are exhausted', async () => {
    const fn = jest
      .fn()
      .mockRejectedValue({ status: 503, message: 'Service Unavailable' });

    await expect(
      withRetry(fn, { maxRetries: 3, initialDelayMs: 1, logger: loggerMock }),
    ).rejects.toEqual({ status: 503, message: 'Service Unavailable' });

    expect(fn).toHaveBeenCalledTimes(3);
    expect(loggerMock.warn).toHaveBeenCalledTimes(2);
  });
});
