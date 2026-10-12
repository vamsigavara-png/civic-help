import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSessionToken } from "@/lib/auth";
import { LoginSchema } from "@/lib/validation";
import { verifyCSRFToken } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const csrfToken = req.headers.get("x-csrf-token");

    if (!csrfToken || !(await verifyCSRFToken(csrfToken))) {
      return NextResponse.json({ error: "CSRF token invalid" }, { status: 403 });
    }

    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const passwordValid = await verifyPassword(parsed.data.password, user.password);
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // If 2FA is required, return a challenge
    if (user.totpVerified && !user.totpSecret) {
      return NextResponse.json(
        { error: "2FA required", requires2FA: true, userId: user.id },
        { status: 202 }
      );
    }

    // Create session token
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Set secure session cookie
    const response = NextResponse.json({ success: true, redirectTo: "/admin" });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
