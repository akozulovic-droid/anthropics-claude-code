import { type NextRequest } from "next/server";
import { applyAuthProxy } from "@/lib/supabase/proxy";

// Next.js 16 renamed `middleware` to `proxy`. Runtime is Node.js.
export async function proxy(request: NextRequest) {
  return applyAuthProxy(request);
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
