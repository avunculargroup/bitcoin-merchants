import { NextRequest, NextResponse } from "next/server";
import Mailjet from "node-mailjet";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

const INFO_EMAIL = "info@bitcoinmerchants.com.au";

async function sendRejectionNotification(email: string, businessName: string, reason?: string) {
  if (!env.mailjetApiKey || !env.mailjetApiSecret) {
    console.warn("Mailjet credentials not configured; skipping rejection notification email");
    return;
  }

  const mailjet = new Mailjet({
    apiKey: env.mailjetApiKey,
    apiSecret: env.mailjetApiSecret,
  });

  const subject = `Update on your submission for ${businessName}`;
  const textBody = `Thank you for your submission to Aussie Bitcoin Merchants.\n\nUnfortunately, we are unable to publish your submission for ${businessName} to OpenStreetMap at this time.\n\n${reason ? `Reason: ${reason}\n\n` : ""}If you have any questions, please reply to this email.`;
  const htmlBody = `
    <p>Thank you for your submission to Aussie Bitcoin Merchants.</p>
    <p>Unfortunately, we are unable to publish your submission for <strong>${businessName}</strong> to OpenStreetMap at this time.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
    <p>If you have any questions, please reply to this email.</p>
  `;

  await mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: env.mailjetFromEmail || "noreply@bitcoinmerchants.com.au",
          Name: "Aussie Bitcoin Merchants",
        },
        To: [
          {
            Email: email,
            Name: "Business Owner",
          },
        ],
        Subject: subject,
        TextPart: textBody,
        HTMLPart: htmlBody,
      },
    ],
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // 1. Get current submission
    const submission = await prisma.submission.findUnique({ where: { id } });
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // 2. Update status
    await prisma.submission.update({
      where: { id },
      data: {
        status: "rejected",
        notes: reason ? `Rejected: ${reason}\n${submission.notes || ""}` : submission.notes,
      },
    });

    // 3. Send notification if user provided email
    if (submission.userEmail) {
      try {
        await sendRejectionNotification(submission.userEmail, submission.businessName, reason);
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Rejection error:", error);
    return NextResponse.json(
      { error: "Failed to reject submission", details: error.message },
      { status: 500 }
    );
  }
}

