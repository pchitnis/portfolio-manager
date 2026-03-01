import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { loginLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limiter";

const handler = NextAuth(authOptions);

async function authHandler(request: Request, context: any) {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === "development") {
    return handler(request, context);
  }
  
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = loginLimiter.check(ip);
  if (!allowed) {
    return rateLimitResponse(retryAfterMs);
  }
  return handler(request, context);
}

export const GET = authHandler;
export const POST = authHandler;
