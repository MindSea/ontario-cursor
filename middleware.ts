import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Mobile Safari (and some in-app browsers) aggressively cache HTML/RSC responses,
 * which can show stale shells after `next dev` HMR or after deploys.
 *
 * Applies `no-store` when:
 * - `NODE_ENV === "development"` (`next dev`)
 * - `VERCEL_ENV === "preview"` (Vercel preview URLs)
 * - `NEXT_PUBLIC_NO_CACHE === "1"` (opt-in for production / `next start` locally)
 *
 * Static assets under `/_next/static`, `/_next/image`, etc. stay on the default
 * long-cache behavior (matcher skips them).
 */
function shouldSendNoStoreHeaders(): boolean {
  if (process.env.NEXT_PUBLIC_NO_CACHE === "1") return true;
  if (process.env.NODE_ENV === "development") return true;
  if (process.env.VERCEL_ENV === "preview") return true;
  return false;
}

export function middleware(request: NextRequest) {
  if (!shouldSendNoStoreHeaders()) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // RSC / flight fetches use the `Next-` request headers; keep behavior aligned.
  const isRsc =
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1" ||
    request.headers.get("Next-Router-State-Tree") != null;

  if (isRsc || request.method === "GET") {
    res.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, max-age=0, must-revalidate",
    );
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and Next internals (default pattern).
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff2?)$).*)",
  ],
};
