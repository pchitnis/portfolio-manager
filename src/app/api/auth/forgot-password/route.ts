import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limiter";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = forgotPasswordLimiter.check(ip);
  if (!allowed) {
    return rateLimitResponse(retryAfterMs);
  }

  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always return success to avoid revealing whether an email is registered
    if (!user) {
      return NextResponse.json({ message: "If that email is registered, a reset link has been sent." });
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json({ message: "If that email is registered, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
