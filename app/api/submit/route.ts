import { NextRequest, NextResponse } from "next/server";
import Mailjet from "node-mailjet";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { openChangeset, createNode, updateNode, updateWay, closeChangeset, fetchNode, fetchWay } from "@/lib/osm";
import { rateLimit } from "@/lib/rate-limit";

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

type SubmissionEmailDetails = {
  businessName: string;
  description?: string;
  category?: string;
  housenumber?: string;
  street?: string;
  suburb?: string;
  postcode?: string;
  state?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  website?: string;
  email?: string;
  facebook?: string;
  instagram?: string;
  openingHours?: string;
  wheelchair?: string;
  notes?: string;
  bitcoinDetails?: BitcoinDetails;
};

type SubmissionNotificationPayload = {
  submissionId: string;
  osmNodeId: number;
  osmNodeUrl: string;
  details: SubmissionEmailDetails;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });

const getDisplayValue = (value?: string | null, fallback = "Not provided") => {
  if (value === undefined || value === null) {
    return fallback;
  }
  const trimmed = `${value}`.trim();
  return trimmed ? trimmed : fallback;
};

const getHtmlValue = (value?: string | null, fallback = "Not provided") =>
  escapeHtml(getDisplayValue(value, fallback)).replace(/\n/g, "<br />");

const formatAddress = (details: SubmissionEmailDetails) => {
  const parts = [
    details.housenumber,
    details.street,
    details.suburb,
    details.city,
    details.state,
    details.postcode,
  ]
    .map((part) => part?.trim())
    .filter(Boolean);

  return parts.join(", ") || "Not provided";
};

const formatCoordinates = (details: SubmissionEmailDetails) => {
  if (typeof details.latitude === "number" && typeof details.longitude === "number") {
    return `${details.latitude.toFixed(6)}, ${details.longitude.toFixed(6)}`;
  }
  return "Not provided";
};

const formatCategory = (category?: string) => {
  if (!category) return "Not provided";
  if (category.startsWith("shop=")) {
    return category.replace("shop=", "");
  }
  if (category.startsWith("amenity=")) {
    return category.replace("amenity=", "");
  }
  return category;
};

const describeBitcoinAcceptance = (details?: BitcoinDetails) => {
  if (!details) {
    return {
      methods: "Not specified",
      lightningOperator: "Not specified",
      acceptance: "Not specified",
    };
  }

  const methods: string[] = [];
  if (details.onChain) methods.push("On-chain");
  if (details.lightning) methods.push("Lightning");
  if (details.lightningContactless) methods.push("Lightning Contactless");
  if (details.other && details.other.length) methods.push(...details.other);

  const acceptance: string[] = [];
  if (details.inStore) acceptance.push("In-store");
  if (details.online) acceptance.push("Online");

  return {
    methods: methods.length ? methods.join(", ") : "Not specified",
    lightningOperator: details.lightningOperator?.trim() || "Not specified",
    acceptance: acceptance.length ? acceptance.join(", ") : "Not specified",
  };
};

const buildSubmissionEmailContent = ({ submissionId, osmNodeId, osmNodeUrl, details }: SubmissionNotificationPayload) => {
  const category = formatCategory(details.category);
  const address = formatAddress(details);
  const coordinates = formatCoordinates(details);
  const bitcoin = describeBitcoinAcceptance(details.bitcoinDetails);

  const textLines = [
    "A new business submission was published to OpenStreetMap.",
    "",
    `Submission ID: ${submissionId}`,
    `OSM Node ID: ${osmNodeId}`,
    `OSM Link: ${osmNodeUrl}`,
    "",
    "Business Details",
    `Name: ${details.businessName}`,
    `Description: ${getDisplayValue(details.description)}`,
    `Category: ${category}`,
    `Address: ${address}`,
    `Coordinates: ${coordinates}`,
    `Phone: ${getDisplayValue(details.phone)}`,
    `Website: ${getDisplayValue(details.website)}`,
    `Email: ${getDisplayValue(details.email)}`,
    `Facebook: ${getDisplayValue(details.facebook)}`,
    `Instagram: ${getDisplayValue(details.instagram)}`,
    `Opening Hours: ${getDisplayValue(details.openingHours)}`,
    `Wheelchair Access: ${getDisplayValue(details.wheelchair)}`,
    `Notes: ${getDisplayValue(details.notes)}`,
    "",
    "Bitcoin Acceptance",
    `Methods: ${bitcoin.methods}`,
    `Lightning Operator: ${bitcoin.lightningOperator}`,
    `Acceptance Locations: ${bitcoin.acceptance}`,
  ];

  const textBody = textLines.join("\n");

  const htmlBody = `
    <h3>New Business Submission Added to OSM</h3>
    <p>A submission was successfully uploaded to OpenStreetMap.</p>
    <p>
      <strong>Submission ID:</strong> ${getHtmlValue(submissionId)}<br />
      <strong>OSM Node:</strong> <a href="${osmNodeUrl}" target="_blank" rel="noopener noreferrer">${osmNodeId}</a>
    </p>
    <h4>Business Details</h4>
    <ul>
      <li><strong>Name:</strong> ${getHtmlValue(details.businessName)}</li>
      <li><strong>Description:</strong> ${getHtmlValue(details.description)}</li>
      <li><strong>Category:</strong> ${getHtmlValue(category)}</li>
      <li><strong>Address:</strong> ${getHtmlValue(address)}</li>
      <li><strong>Coordinates:</strong> ${getHtmlValue(coordinates)}</li>
      <li><strong>Phone:</strong> ${getHtmlValue(details.phone)}</li>
      <li><strong>Website:</strong> ${getHtmlValue(details.website)}</li>
      <li><strong>Email:</strong> ${getHtmlValue(details.email)}</li>
      <li><strong>Facebook:</strong> ${getHtmlValue(details.facebook)}</li>
      <li><strong>Instagram:</strong> ${getHtmlValue(details.instagram)}</li>
      <li><strong>Opening Hours:</strong> ${getHtmlValue(details.openingHours)}</li>
      <li><strong>Wheelchair Access:</strong> ${getHtmlValue(details.wheelchair)}</li>
      <li><strong>Notes:</strong> ${getHtmlValue(details.notes)}</li>
    </ul>
    <h4>Bitcoin Acceptance</h4>
    <ul>
      <li><strong>Methods:</strong> ${getHtmlValue(bitcoin.methods)}</li>
      <li><strong>Lightning Operator:</strong> ${getHtmlValue(bitcoin.lightningOperator)}</li>
      <li><strong>Acceptance Locations:</strong> ${getHtmlValue(bitcoin.acceptance)}</li>
    </ul>
  `.trim();

  const subject = `New submission added: ${details.businessName}`;

  return { subject, textBody, htmlBody };
};

async function sendSubmissionNotification(payload: SubmissionNotificationPayload) {
  if (!env.mailjetApiKey || !env.mailjetApiSecret) {
    console.warn("Mailjet credentials not configured; skipping submission notification email");
    return;
  }

  const mailjet = new Mailjet({
    apiKey: env.mailjetApiKey,
    apiSecret: env.mailjetApiSecret,
  });

  const { subject, textBody, htmlBody } = buildSubmissionEmailContent(payload);

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

/**
 * Build OSM tags from form data
 */
function buildTagsFromForm(data: {
  businessName: string;
  description?: string;
  category?: string;
  housenumber?: string;
  street?: string;
  suburb?: string;
  postcode?: string;
  state?: string;
  city?: string;
  phone?: string;
  website?: string;
  email?: string;
  facebook?: string;
  instagram?: string;
  openingHours?: string;
  wheelchair?: string;
  bitcoinDetails?: any;
}): Record<string, string> {
  const today = new Date().toISOString().split('T')[0];
  const tags: Record<string, string> = {};

  // Name is always set
  if (data.businessName) {
    tags.name = data.businessName;
  }

  // Category
  if (data.category) {
    if (data.category.startsWith("shop=")) {
      tags.shop = data.category.replace("shop=", "");
    } else if (data.category.startsWith("amenity=")) {
      tags.amenity = data.category.replace("amenity=", "");
    } else {
      tags.shop = data.category;
    }
  }

  // Address fields
  if (data.description) tags.description = data.description;
  if (data.housenumber) tags["addr:housenumber"] = data.housenumber;
  if (data.street) tags["addr:street"] = data.street;
  if (data.suburb) tags["addr:suburb"] = data.suburb;
  if (data.postcode) tags["addr:postcode"] = data.postcode;
  if (data.state) tags["addr:state"] = data.state;
  if (data.city) tags["addr:city"] = data.city;

  // Contact fields
  if (data.phone) {
    tags["contact:phone"] = data.phone;
    tags["phone"] = data.phone;
  }
  if (data.website) {
    tags["contact:website"] = data.website;
    tags["website"] = data.website;
  }
  if (data.email) {
    tags["contact:email"] = data.email;
    tags["email"] = data.email;
  }
  if (data.facebook) tags["contact:facebook"] = data.facebook;
  if (data.instagram) tags["contact:instagram"] = data.instagram;

  // Other fields
  if (data.openingHours) tags["opening_hours"] = data.openingHours;
  if (data.wheelchair) tags["wheelchair"] = data.wheelchair;

  // Always update check_date
  tags["check_date"] = today;

  // Bitcoin acceptance tags
  if (data.bitcoinDetails) {
    if (data.bitcoinDetails.onChain) {
      tags["currency:XBT"] = "yes";
      tags["payment:onchain"] = "yes";
      tags["check_date:currency:XBT"] = today;
    }
    if (data.bitcoinDetails.lightning) tags["payment:lightning"] = "yes";
    if (data.bitcoinDetails.lightningContactless) tags["payment:lightning_contactless"] = "yes";
    if (data.bitcoinDetails.lightningOperator) tags["payment:lightning:operator"] = data.bitcoinDetails.lightningOperator;
    if (data.bitcoinDetails.other && data.bitcoinDetails.other.length > 0) {
      tags["payment:bitcoin:other"] = data.bitcoinDetails.other.join(";");
    }
  }

  return tags;
}

/**
 * Smart merge: Update existing tags with form data, preserve other tags
 */
function mergeTags(existingTags: Record<string, string>, formTags: Record<string, string>): Record<string, string> {
  // Start with existing tags
  const merged = { ...existingTags };

  // Update/add tags from form
  for (const [key, value] of Object.entries(formTags)) {
    merged[key] = value;
  }

  return merged;
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
    const submissionEmailDetails: SubmissionEmailDetails = {
      businessName,
      description,
      category,
      housenumber,
      street,
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
      openingHours,
      wheelchair,
      notes,
      bitcoinDetails,
    };

    // Check for duplicates
    let isDuplicate = false;
    let duplicateOsmId: number | null = null;
    let duplicateOsmType: string | null = null;

    if (latitude && longitude) {
      const duplicateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/check-duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, businessName }),
      });
      const duplicateData = await duplicateResponse.json();

      if (duplicateData.isDuplicate) {
        isDuplicate = true;
        duplicateOsmId = duplicateData.osmId;
        duplicateOsmType = duplicateData.osmType;
      }
    }

    // Create submission in database (will be updated after OSM edit/create)
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
      },
    });

    // If duplicate found, edit the existing node/way instead of creating new
    if (isDuplicate && duplicateOsmId && duplicateOsmType) {
      try {
        // Build tags from form data
        const formTags = buildTagsFromForm({
          businessName,
          description,
          category,
          housenumber,
          street,
          suburb,
          postcode,
          state,
          city,
          phone,
          website: normalizedWebsite,
          email,
          facebook,
          instagram,
          openingHours,
          wheelchair,
          bitcoinDetails,
        });

        // Fetch current element data
        let mergedTags: Record<string, string>;
        let elementVersion: number;
        let elementId: number;
        let wayNodes: number[] | null = null;
        let nodeLat: number | null = null;
        let nodeLon: number | null = null;

        if (duplicateOsmType === "way") {
          const existingWay = await fetchWay(duplicateOsmId);
          mergedTags = mergeTags(existingWay.tags, formTags);
          elementVersion = existingWay.version;
          elementId = existingWay.id;
          wayNodes = existingWay.nodes;
        } else {
          const existingNode = await fetchNode(duplicateOsmId);
          mergedTags = mergeTags(existingNode.tags, formTags);
          elementVersion = existingNode.version;
          elementId = existingNode.id;
          nodeLat = existingNode.lat;
          nodeLon = existingNode.lon;
        }

        // Create changeset for update
        const changesetId = await openChangeset("Updated Bitcoin-accepting business via Aussie Bitcoin Merchants");

        // Update the element
        if (duplicateOsmType === "way" && wayNodes) {
          await updateWay(elementId, { tags: mergedTags, nodes: wayNodes }, elementVersion, changesetId);
        } else if (nodeLat !== null && nodeLon !== null) {
          await updateNode(elementId, { lat: nodeLat, lon: nodeLon, tags: mergedTags }, elementVersion, changesetId);
        } else {
          throw new Error("Invalid element type or missing data");
        }

        // Close changeset
        await closeChangeset(changesetId);

        // Update submission status
        await prisma.submission.update({
          where: { id: submission.id },
          data: { status: "uploaded" },
        });

        // Create OSM node/way record
        await prisma.osmNode.create({
          data: {
            osmId: BigInt(elementId),
            submissionId: submission.id,
            changesetId: BigInt(changesetId),
            version: elementVersion + 1, // Version increments after update
            uploadedAt: new Date(),
          },
        });

        const elementType = duplicateOsmType === "way" ? "way" : "node";
        return NextResponse.json({
          success: true,
          submissionId: submission.id,
          osmNodeId: elementId,
          osmNodeUrl: `https://www.openstreetmap.org/${elementType}/${elementId}`,
          message: "Business information successfully updated on OpenStreetMap!",
          updated: true,
        });
      } catch (editError: any) {
        console.error("OSM edit error:", editError);
        
        // Handle specific error cases
        if (editError.message?.includes("has been deleted")) {
          // Element was deleted, fall through to create new node
          console.warn(`OSM ${duplicateOsmType} ${duplicateOsmId} was deleted, creating new node instead`);
          isDuplicate = false;
        } else if (editError.message?.includes("Version conflict")) {
          // Version conflict - element was edited by someone else
          await prisma.submission.update({
            where: { id: submission.id },
            data: { status: "pending", notes: `OSM edit failed: ${editError.message}` },
          });
          return NextResponse.json(
            {
              success: false,
              error: "The business listing was modified by another user. Your submission has been saved for manual review.",
              submissionId: submission.id,
            },
            { status: 409 }
          );
        } else {
          // Other error - save as pending for manual review
          await prisma.submission.update({
            where: { id: submission.id },
            data: { status: "pending", notes: `OSM edit failed: ${editError.message}` },
          });
          return NextResponse.json(
            {
              success: false,
              error: "Failed to update OpenStreetMap. Your submission has been saved for manual review.",
              submissionId: submission.id,
            },
            { status: 500 }
          );
        }
      }
    }

    // Create new node (no duplicate found, or duplicate edit failed and element was deleted)
    try {
      // Build OSM tags from form data
      const tags = buildTagsFromForm({
        businessName,
        description,
        category,
        housenumber,
        street,
        suburb,
        postcode,
        state,
        city,
        phone,
        website: normalizedWebsite,
        email,
        facebook,
        instagram,
        openingHours,
        wheelchair,
        bitcoinDetails,
      });

      // Create OSM changeset
      const changesetId = await openChangeset("Added Bitcoin-accepting business via Aussie Bitcoin Merchants");

      // Create OSM node
      const osmNodeId = await createNode(
        {
          lat: latitude || 0,
          lon: longitude || 0,
          tags,
        },
        changesetId
      );

      // Close changeset
      await closeChangeset(changesetId);

      // Update submission with OSM node info
      await prisma.submission.update({
        where: { id: submission.id },
        data: { status: "uploaded" },
      });

      await prisma.osmNode.create({
        data: {
          osmId: BigInt(osmNodeId),
          submissionId: submission.id,
          changesetId: BigInt(changesetId),
          uploadedAt: new Date(),
        },
      });

      const osmNodeUrl = `https://www.openstreetmap.org/node/${osmNodeId}`;

      try {
        await sendSubmissionNotification({
          submissionId: submission.id,
          osmNodeId,
          osmNodeUrl,
          details: submissionEmailDetails,
        });
      } catch (emailError) {
        console.error("Submission notification email error:", emailError);
      }

      return NextResponse.json({
        success: true,
        submissionId: submission.id,
        osmNodeId,
        osmNodeUrl,
        message: "Business successfully added to OpenStreetMap!",
      });
    } catch (osmError: any) {
      console.error("OSM upload error:", osmError);
      // Keep submission as pending for manual review
      await prisma.submission.update({
        where: { id: submission.id },
        data: { status: "pending", notes: `OSM upload failed: ${osmError.message}` },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Failed to upload to OpenStreetMap. Your submission has been saved for manual review.",
          submissionId: submission.id,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Failed to process submission", details: error.message },
      { status: 500 }
    );
  }
}

