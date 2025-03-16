export interface FastFetchOptions {
  /** Number of retries if fetch fails (default: 0 = no retry) */
  retries?: number;
  /** Time to wait (ms) before retry (default: 1000 ms) */
  retryDelay?: number;
  /** Deduplicate in-flight requests with same signature (default: true) */
  deduplicate?: boolean;
  /** Optional function to decide if a retry is needed based on status, error, etc. */
  shouldRetry?: (error: any, attempt: number) => boolean;
}

export declare function fastFetch(
  input: RequestInfo,
  init?: RequestInit & FastFetchOptions
): Promise<Response>;
