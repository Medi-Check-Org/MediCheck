// lib/rate-limit/withRateLimit.ts
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "./tokenBucket";
import { logRateLimitViolation } from "./logViolation";
import { RATE_LIMITS } from "./config";

export function withRateLimit<TContext>(
  handler: (req: NextRequest, context: TContext) => Promise<NextResponse>,
  options?: { strict?: boolean }
) {
  return async (req: NextRequest, context: TContext): Promise<NextResponse> => {
    const apiKey = req.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json({ error: "API key missing" }, { status: 401 });
    }

    const config = options?.strict
      ? RATE_LIMITS.PARTNER_STRICT
      : RATE_LIMITS.PARTNER_DEFAULT;

    const result = await checkRateLimit(apiKey, config);

    if (!result.allowed) {
      logRateLimitViolation({
        apiKey,
        endpoint: req.nextUrl.pathname,
        method: req.method,
      });

      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // 🔑 Preserve the exact context type
    return handler(req, context);
  };
}
