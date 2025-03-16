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
    body: init?.body ?? null,
  };
  return JSON.stringify(normalized);
}
/**
 * Sleep helper for retryDelay
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * FastFetch main function
 * - Retries on error with exponential backoff
 * - Deduplicates in-flight requests if deduplicate = true
 */
export async function fastFetch(input, init) {
  const {
    retries = 0,
    retryDelay = 1000,
    deduplicate = true,
    shouldRetry,
  } = init || {};
  console.log("[FastFetch] Starting request for:", input);
  // If deduplicating, check if a matching in-flight request exists
  let signature = "";
  if (deduplicate) {
    signature = makeSignature(input, init);
    if (inFlightMap.has(signature)) {
      console.log(
        "[FastFetch] Found in-flight request for signature:",
        signature,
      );
      return inFlightMap.get(signature);
    }
  }
  // Build a promise chain that tries up to retries + 1 times with exponential backoff
  let attempt = 0;
  let promise = (async function fetchWithRetry() {
    while (true) {
      try {
        attempt++;
        console.log(`[FastFetch] Attempt #${attempt} for:`, input);
        const response = await fetch(input, init);
        if (!response.ok && shouldRetry) {
          const doRetry = shouldRetry(response, attempt);
          console.log(
            `[FastFetch] Response not ok (status: ${response.status}). Retry decision: ${doRetry}`,
          );
          if (doRetry && attempt <= retries) {
            const delay = retryDelay * Math.pow(2, attempt - 1);
            console.log(
              `[FastFetch] Waiting ${delay}ms (exponential backoff) before retrying...`,
            );
            await sleep(delay);
            continue; // try again
          }
        }
        console.log(`[FastFetch] Request succeeded on attempt #${attempt}`);
        return response;
      } catch (error) {
        console.log(`[FastFetch] Caught error on attempt #${attempt}:`, error);
        if (shouldRetry) {
          const doRetry = shouldRetry(error, attempt);
          console.log(`[FastFetch] Retry decision based on error: ${doRetry}`);
          if (doRetry && attempt <= retries) {
            const delay = retryDelay * Math.pow(2, attempt - 1);
            console.log(
              `[FastFetch] Waiting ${delay}ms (exponential backoff) before retrying after error...`,
            );
            await sleep(delay);
            continue;
          }
        } else {
          if (attempt <= retries) {
            const delay = retryDelay * Math.pow(2, attempt - 1);
            console.log(
              `[FastFetch] Retrying attempt #${attempt} after error. Waiting ${delay}ms...`,
            );
            await sleep(delay);
            continue;
          }
        }
        console.log("[FastFetch] No more retries. Throwing error.");
        throw error;
      }
    }
  })();
  // If deduplicating, store in the map so subsequent calls get the same promise
  if (deduplicate) {
    inFlightMap.set(signature, promise);
    console.log(
      "[FastFetch] Stored in-flight request with signature:",
      signature,
    );
  }
  try {
    const result = await promise;
    return result;
  } finally {
    // Once done (success or fail), remove from inFlightMap
    if (deduplicate) {
      inFlightMap.delete(signature);
      console.log(
        "[FastFetch] Removed in-flight record for signature:",
        signature,
      );
    }
  }
}
