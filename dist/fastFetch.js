import fetch from "cross-fetch";
/**
 * Ongoing in-flight requests for deduplication:
 * Keyed by a stable signature of { url, method, headers, body }
 */
const inFlightMap = new Map();
/**
 * Generate a signature for dedup if deduplicate is true
 */
function makeSignature(input, init) {
    // Basic approach:
    const normalized = {
        url: typeof input === "string" ? input : input.url,
        method: init?.method ?? "GET",
        headers: init?.headers ?? {},
        body: init?.body ?? null
    };
    return JSON.stringify(normalized);
}
/**
 * Sleep helper for retryDelay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * FastFetch main function
 * - Retries on error
 * - Deduplicates in-flight requests if deduplicate = true
 */
export async function fastFetch(input, init) {
    const { retries = 0, retryDelay = 1000, deduplicate = true, shouldRetry } = init || {};
    // If deduplicating, check if a matching in-flight request exists
    let signature = "";
    if (deduplicate) {
        signature = makeSignature(input, init);
        if (inFlightMap.has(signature)) {
            return inFlightMap.get(signature);
        }
    }
    // We'll build a promise chain that tries up to `retries + 1` times
    let attempt = 0;
    let promise = (async function fetchWithRetry() {
        while (true) {
            try {
                attempt++;
                const response = await fetch(input, init);
                // If success status or we don't want to parse error, just return it
                if (!response.ok && shouldRetry) {
                    // If user-defined logic says "retry again," we do so
                    const doRetry = shouldRetry(response, attempt);
                    if (doRetry && attempt <= retries) {
                        await sleep(retryDelay);
                        continue; // try again
                    }
                }
                return response;
            }
            catch (error) {
                // If fetch truly fails (like network error), see if we can retry
                if (shouldRetry) {
                    const doRetry = shouldRetry(error, attempt);
                    if (doRetry && attempt <= retries) {
                        await sleep(retryDelay);
                        continue;
                    }
                }
                else {
                    // By default, if not a 2xx response or network error, we only retry up to `retries`
                    if (attempt <= retries) {
                        await sleep(retryDelay);
                        continue;
                    }
                }
                throw error;
            }
        }
    })();
    // If deduplicating, store in the map so subsequent calls get the same promise
    if (deduplicate) {
        inFlightMap.set(signature, promise);
    }
    try {
        const result = await promise;
        return result;
    }
    finally {
        // Once done (success or fail), remove from inFlightMap
        if (deduplicate) {
            inFlightMap.delete(signature);
        }
    }
}
