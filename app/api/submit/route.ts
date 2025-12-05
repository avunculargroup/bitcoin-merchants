import { NextRequest, NextResponse } from "next/server";
import Mailjet from "node-mailjet";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

const websiteDomainPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;
const INFO_EMAIL = "info@bitcoinmerchants.com.au";

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

function formatValueForEmail(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmailBodies(details: Record<string, unknown>) {
  const entries = Object.entries(details);
  const textLines = entries.map(([key, value]) => `${key}: ${formatValueForEmail(value)}`);
  const textBody = ["A new submission has been received.", "", ...textLines].join("\n");

  const htmlSections = entries
    .map(([key, value]) => {
      const formatted = escapeHtml(formatValueForEmail(value)).replace(/\n/g, "<br />");
      return `<p><strong>${key}:</strong><br />${formatted}</p>`;
    })
    .join("");

  const htmlBody = `
    <h3>New submission received</h3>
    ${htmlSections}
  `;

  return { textBody, htmlBody };
}

async function sendSubmissionNotification(details: Record<string, unknown>) {
  if (!env.mailjetApiKey || !env.mailjetApiSecret) {
    console.warn("Mailjet credentials not configured; skipping submission notification email");
    return;
  }

  const { textBody, htmlBody } = buildEmailBodies(details);
  const subject = `New Submission: ${details["Business Name"] || "Unknown business"}`;

  const mailjet = new Mailjet({
    apiKey: env.mailjetApiKey,
    apiSecret: env.mailjetApiSecret,
  });

  await mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: env.mailjetFromEmail || "noreply@bitcoinmerchants.com.au",
          Name: "Aussie Bitcoin Merchants",
        },
        To: [
          {
            Email: INFO_EMAIL,
            Name: "Aussie Bitcoin Merchants",
          },
        ],
        Subject: subject,
        TextPart: textBody,
        HTMLPart: htmlBody,
      },
    ],
  });
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

    try {
      await sendSubmissionNotification({
        "Submission ID": submission.id,
        "Business Name": businessName,
        Description: description,
        Category: category,
        Street: street,
        "House Number": housenumber,
        Suburb: suburb,
        Postcode: postcode,
        State: state,
        City: city,
        Latitude: latitude,
        Longitude: longitude,
        Phone: phone,
        "Website (original)": website,
        "Website (normalized)": normalizedWebsite,
        Email: email,
        Facebook: facebook,
        Instagram: instagram,
        "Bitcoin Details": bitcoinDetails || {},
        "Opening Hours": openingHours,
        Wheelchair: wheelchair,
        Notes: notes,
        "Duplicate OSM ID": duplicateOsmId,
        "Duplicate OSM Type": duplicateOsmType,
        "Admin Review Status": submission.status,
        "Submitted At": new Date().toISOString(),
      });
    } catch (emailError) {
      console.error("Failed to send submission notification email:", emailError);
    }

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
