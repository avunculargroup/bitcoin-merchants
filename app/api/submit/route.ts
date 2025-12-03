import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const websiteDomainPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;

type BitcoinDetails = {
  onChain?: boolean;
  lightning?: boolean;
  lightningContactless?: boolean;
  lightningOperator?: string;
  other?: string[];
  inStore?: boolean;
  online?: boolean;
};

const formatWebsiteForOsm = (value?: string | null) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!websiteDomainPattern.test(trimmed)) {
    return null;
  }
  if (/^http:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

async function verifyCaptcha(token: string): Promise<boolean> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/verify-captcha`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = await response.json();
  return data.valid === true;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  if (!rateLimit(ip, 5, 60000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const {
      captchaToken,
      businessName,
      description,
      category,
      street,
      housenumber,
      suburb,
      postcode,
      state,
      city,
      latitude,
      longitude,
      phone,
      website,
      email,
      facebook,
      instagram,
      bitcoinDetails,
      openingHours,
      wheelchair,
      notes,
    } = body;

    // Verify captcha
    if (!captchaToken || !(await verifyCaptcha(captchaToken))) {
      return NextResponse.json(
        { error: "Invalid captcha token" },
        { status: 400 }
      );
    }

    const formattedWebsite = formatWebsiteForOsm(website);
    if (formattedWebsite === null) {
      return NextResponse.json(
        { error: "Website must include a valid domain and TLD" },
        { status: 400 }
      );
    }
    const normalizedWebsite = formattedWebsite ?? undefined;

    // Check for duplicates
    let duplicateOsmId: number | null = null;
    let duplicateOsmType: string | null = null;

    if (latitude && longitude) {
      try {
        const duplicateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/check-duplicate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude, businessName }),
        });
        const duplicateData = await duplicateResponse.json();

        if (duplicateData.isDuplicate) {
          duplicateOsmId = duplicateData.osmId;
          duplicateOsmType = duplicateData.osmType;
        }
      } catch (error) {
        console.error("Duplicate check failed:", error);
        // Continue without duplicate info if check fails
      }
    }

    // Create submission in database
    // Status is always "pending" for admin review
    const submission = await prisma.submission.create({
      data: {
        status: "pending",
        businessName,
        description,
        category,
        street,
        housenumber,
        suburb,
        postcode,
        state,
        city,
        latitude,
        longitude,
        phone,
        website: normalizedWebsite,
        email,
        facebook,
        instagram,
        bitcoinDetails: bitcoinDetails || {},
        openingHours,
        wheelchair,
        notes,
        userEmail: email,
        duplicateOsmId: duplicateOsmId ? BigInt(duplicateOsmId) : null,
        duplicateOsmType: duplicateOsmType || null,
      },
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: "Submission received! It will be reviewed by an admin shortly.",
    });

  } catch (error: any) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Failed to process submission", details: error.message },
      { status: 500 }
    );
  }
}
