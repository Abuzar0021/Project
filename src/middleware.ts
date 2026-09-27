import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/account";

export function middleware(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const signedIn = request.cookies.has(SESSION_COOKIE);

  if ((pathname.startsWith("/app") || pathname === "/welcome") && !signedIn) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if ((pathname === "/login" || pathname === "/signup") && signedIn) {
    // A plan picked on the pricing page carries over to Settings.
    const plan = searchParams.get("plan");
    const url = new URL(plan ? "/app/settings" : "/app", request.url);
    if (plan) {
      url.searchParams.set("plan", plan);
      url.searchParams.set("period", searchParams.get("period") ?? "yearly");
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/welcome", "/login", "/signup"],
};
