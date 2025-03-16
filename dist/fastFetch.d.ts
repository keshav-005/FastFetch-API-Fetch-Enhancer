/**
 * Options for controlling FastFetch behavior:
 * - `retries` -> number of times to retry on failure
 * - `retryDelay` -> base delay in ms before next retry (will be multiplied exponentially)
 * - `deduplicate` -> whether to merge identical requests in-flight
 * - `shouldRetry` -> custom logic to decide if we retry
 */
export interface FastFetchOptions {
    retries?: number;
    retryDelay?: number;
    deduplicate?: boolean;
    shouldRetry?: (error: any, attempt: number) => boolean;
}
/**
 * FastFetch main function
 * - Retries on error with exponential backoff
 * - Deduplicates in-flight requests if deduplicate = true
 */
export declare function fastFetch(input: RequestInfo, init?: RequestInit & FastFetchOptions): Promise<Response>;
//# sourceMappingURL=fastFetch.d.ts.map