import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifySolution } from "altcha-lib";

// ALTCHA verification
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    if (!env.altchaSecretKey) {
      console.warn("ALTCHA secret key not configured - accepting all tokens in development");
      // In development, accept all tokens if secret is not set
      return NextResponse.json({ valid: true });
    }

    // Verify ALTCHA solution using altcha-lib
    try {
      const verified = verifySolution(token, env.altchaSecretKey);
      
      if (verified) {
        return NextResponse.json({ valid: true });
      } else {
        console.warn("ALTCHA verification failed for token");
        return NextResponse.json({ valid: false }, { status: 400 });
      }
    } catch (verificationError: any) {
      console.error("ALTCHA verification error:", verificationError);
      return NextResponse.json(
        { error: "Invalid ALTCHA solution", valid: false },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Captcha verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify captcha" },
      { status: 500 }
    );
  }
}

