/** Browser client for /api/check. Network errors, 429 and 5xx are worth retrying. */
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
