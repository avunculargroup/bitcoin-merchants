import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import Mailjet from "node-mailjet";

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Rate limiting: 5 requests per 10 minutes per IP
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  if (!rateLimit(ip, 5, 600000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { name, email, comment } = await request.json();

    // Validate required fields
    if (!name || !email || !comment) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check if Mailjet is configured
    if (!env.mailjetApiKey || !env.mailjetApiSecret) {
      console.error("Mailjet credentials not configured");
      return NextResponse.json(
        { error: "Email service not configured. Please contact support directly." },
        { status: 500 }
      );
    }

    // Initialize Mailjet
    const mailjet = new Mailjet({
      apiKey: env.mailjetApiKey,
      apiSecret: env.mailjetApiSecret,
    });

    // Send email via Mailjet
    const result = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: env.mailjetFromEmail || "noreply@bitcoinmerchants.com.au",
            Name: "Aussie Bitcoin Merchants Contact Form",
          },
          To: [
            {
              Email: "info@bitcoinmerchants.com.au",
              Name: "Aussie Bitcoin Merchants",
            },
          ],
          Subject: `Contact Form Submission from ${name}`,
          TextPart: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${comment}`,
          HTMLPart: `
            <h3>Contact Form Submission</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Message:</strong></p>
            <p>${comment.replace(/\n/g, "<br>")}</p>
          `,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error: any) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}

