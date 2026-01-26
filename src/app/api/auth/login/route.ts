import { login, SESSION_COOKIE_NAME, SESSION_DURATION } from "@/lib/auth";
import { checkRateLimit, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";
import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface LoginRequest {
  password?: string;
}

function getClientIP(request: NextRequest): string {
  // Cloudflare provides the real IP in CF-Connecting-IP header
  const headersList = request.headers;
  return (
    headersList.get("cf-connecting-ip") ||
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  try {
    // Check rate limit
    const rateLimit = await checkRateLimit(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many attempts. Try again in ${Math.ceil(rateLimit.retryAfterSeconds! / 60)} minutes.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const body = (await request.json()) as LoginRequest;
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json({ success: false, error: "Password required" }, { status: 400 });
    }

    const sessionToken = await login(password);

    if (!sessionToken) {
      // Record failed attempt
      await recordFailedAttempt(ip);
      const remaining = rateLimit.remainingAttempts - 1;

      return NextResponse.json(
        {
          success: false,
          error: remaining > 0
            ? `Invalid password. ${remaining} attempts remaining.`
            : "Invalid password. Account temporarily locked.",
        },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    await clearAttempts(ip);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
  }
}
