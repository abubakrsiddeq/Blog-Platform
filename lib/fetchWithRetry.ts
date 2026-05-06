/**
 * Wraps fetch() with automatic retry on 5xx server errors.
 *
 * On Vercel serverless, the very first request after a cold start can hit a
 * 500 while the DB connection is being established. Retrying transparently
 * means the user never sees the error.
 *
 * @param input   - URL or Request (same as fetch)
 * @param init    - RequestInit options (same as fetch)
 * @param retries - Max number of attempts (default 3)
 * @param delay   - Base delay in ms between retries, doubles each time (default 800)
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 3,
  delay = 800,
): Promise<Response> {
  let lastResponse: Response | null = null

  for (let attempt = 0; attempt < retries; attempt++) {
    if (attempt > 0) {
      await new Promise(res => setTimeout(res, delay * attempt))
    }

    try {
      const res = await fetch(input, init)

      // Only retry on 5xx — 4xx errors are the client's fault, don't retry
      if (res.status >= 500 && attempt < retries - 1) {
        lastResponse = res
        continue
      }

      return res
    } catch (err) {
      // Network error (offline, DNS failure, etc.)
      if (attempt === retries - 1) throw err
    }
  }

  // Return the last 5xx response so the caller can read the error body
  return lastResponse!
}
