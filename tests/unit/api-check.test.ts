/**
 * Unit tests for the /api/check route: it validates input, trims the
 * LanguageTool response to our shape, short-circuits empty text, and turns an
 * unreachable checker into a clean 503 rather than a stack trace. fetch is
 * mocked so no real network or LanguageTool is needed.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { POST } from "@/app/api/check/route";

function request(body: unknown, ip: string): Request {
  return new Request("http://localhost/api/check", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/check", () => {
  it("rejects a missing text field", async () => {
    const res = await POST(request({ language: "en-US" }, "ip-1"));
    expect(res.status).toBe(400);
  });

  it("rejects an unsupported language", async () => {
    const res = await POST(request({ text: "hi", language: "fr" }, "ip-2"));
    expect(res.status).toBe(400);
  });

  it("returns an empty match list for empty text without calling the checker", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await POST(request({ text: "   ", language: "en-US" }, "ip-3"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.matches).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("trims the LanguageTool response", async () => {
    const ltPayload = {
      matches: [
        {
          offset: 5,
          length: 6,
          message: "Possible spelling mistake found.",
          shortMessage: "Spelling mistake",
          replacements: [{ value: "shipped" }, { value: "shape" }],
          rule: {
            id: "MORFOLOGIK_RULE_EN_US",
            issueType: "misspelling",
            category: { id: "TYPOS", name: "Possible Typo" },
          },
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({ ok: true, json: async () => ltPayload }) as unknown as Response,
      ),
    );

    const res = await POST(
      request({ text: "I shiped it", language: "en-US" }, "ip-4"),
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0].replacements).toEqual(["shipped", "shape"]);
    expect(data.matches[0].rule.category.id).toBe("TYPOS");
    expect(data.matches[0].rule.issueType).toBe("misspelling");
  });

  it("returns 503 when the checker cannot be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connection refused");
      }),
    );
    const res = await POST(
      request({ text: "hello", language: "en-US" }, "ip-5"),
    );
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(typeof data.error).toBe("string");
  });
});
