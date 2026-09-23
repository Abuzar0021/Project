/**
 * languagetool.ts: typed browser client for our /api/check route.
 * It posts a single block's text and returns the trimmed matches. A failure that
 * looks like the checker being unreachable (network error, 429, 5xx) is thrown
 * as a retriable CheckerError so the scheduler can back off; aborts propagate as
 * the native AbortError so superseded requests unwind quietly.
 */
import type { CheckResponse, RawMatch } from "@/types/languagetool";

export class CheckerError extends Error {
  constructor(
    message: string,
    readonly retriable: boolean,
  ) {
    super(message);
    this.name = "CheckerError";
  }
}

export async function fetchMatches(
  text: string,
  language: string,
  signal: AbortSignal,
): Promise<RawMatch[]> {
  let response: Response;
  try {
    response = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
      signal,
    });
  } catch (error) {
    // AbortError is expected when a request is superseded; let it through.
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new CheckerError("Cannot reach the checker.", true);
  }

  if (!response.ok) {
    // 429 and 5xx are transient; 4xx (bad input) is not worth retrying.
    const retriable = response.status === 429 || response.status >= 500;
    throw new CheckerError(`Checker responded ${response.status}.`, retriable);
  }

  const data = (await response.json()) as CheckResponse;
  return data.matches;
}
