import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createChallenge } from "altcha-lib";

export async function GET(request: NextRequest) {
  try {
    if (!env.altchaSecretKey) {
      return NextResponse.json(
        { error: "ALTCHA secret key not configured" },
        { status: 500 }
      );
    }

    // Generate ALTCHA challenge using altcha-lib
    // createChallenge returns a Promise and expects an options object
    const challenge = await createChallenge({
      hmacKey: env.altchaSecretKey,
    });

    // Return challenge to frontend
    return NextResponse.json(challenge);
  } catch (error: any) {
    console.error("ALTCHA challenge generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate ALTCHA challenge" },
      { status: 500 }
    );
  }
}

