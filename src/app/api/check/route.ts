/**
 * /api/check: the only path between the browser and LanguageTool.
 * The client never talks to LanguageTool directly. This route validates input,
 * rate-limits per IP, forwards the text as form data to LANGUAGETOOL_URL/v2/check,
 * and returns a trimmed, typed match list. Errors return a plain JSON message
 * and an appropriate status, never a stack trace.
 */
import { NextResponse } from "next/server";
import type { CheckResponse, RawMatch } from "@/types/languagetool";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 20_000;
const ALLOWED_LANGUAGES = new Set(["en-US", "en-GB"]);
const RATE_LIMIT = 60; // requests
const RATE_WINDOW_MS = 60_000; // per minute
const MAX_REPLACEMENTS = 10;

// Minimal shape of the LanguageTool response we depend on.
interface LanguageToolMatch {
  offset: number;
  length: number;
  message: string;
  shortMessage?: string;
  replacements?: { value: string }[];
  rule: {
    id: string;
    issueType?: string;
    category: { id: string; name?: string };
  };
}
interface LanguageToolResponse {
  matches?: LanguageToolMatch[];
}

// In-memory sliding-window rate limiter. Fine for a single-instance demo; a
// multi-instance deploy would move this to a shared store.
const hits = new Map<string, number[]>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return errorResponse("Too many requests. Slow down and try again.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const { text, language } = (body ?? {}) as {
    text?: unknown;
    language?: unknown;
  };

  if (typeof text !== "string") {
    return errorResponse("Field 'text' is required and must be a string.", 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return errorResponse(
      `Field 'text' must be at most ${MAX_TEXT_LENGTH} characters.`,
      400,
    );
  }
  const lang = typeof language === "string" ? language : "en-US";
  if (!ALLOWED_LANGUAGES.has(lang)) {
    return errorResponse("Unsupported language.", 400);
  }

  // An empty or whitespace-only block has no matches; skip the round trip.
  if (text.trim().length === 0) {
    return NextResponse.json({ matches: [] } satisfies CheckResponse);
  }

  const base = process.env.LANGUAGETOOL_URL ?? "http://localhost:8010";
  const form = new URLSearchParams({
    text,
    language: lang,
    enabledOnly: "false",
  });

  let ltResponse: Response;
  try {
    ltResponse = await fetch(`${base}/v2/check`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
  } catch {
    return errorResponse("Cannot reach the checker.", 503);
  }

  if (!ltResponse.ok) {
    return errorResponse("The checker returned an error.", 502);
  }

  let data: LanguageToolResponse;
  try {
    data = (await ltResponse.json()) as LanguageToolResponse;
  } catch {
    return errorResponse("The checker returned an invalid response.", 502);
  }

  const matches: RawMatch[] = (data.matches ?? []).map((m) => ({
    offset: m.offset,
    length: m.length,
    message: m.message,
    ...(m.shortMessage ? { shortMessage: m.shortMessage } : {}),
    replacements: (m.replacements ?? [])
      .slice(0, MAX_REPLACEMENTS)
      .map((r) => r.value),
    rule: {
      id: m.rule.id,
      ...(m.rule.issueType ? { issueType: m.rule.issueType } : {}),
      category: { id: m.rule.category.id, name: m.rule.category.name },
    },
  }));

  return NextResponse.json({ matches } satisfies CheckResponse);
}
