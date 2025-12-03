import { NextRequest, NextResponse } from "next/server";
import Mailjet from "node-mailjet";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { openChangeset, createNode, updateNode, updateWay, closeChangeset, fetchNode, fetchWay } from "@/lib/osm";

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
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return char;
    }
  });

const getDisplayValue = (value?: string | null, fallback = "Not provided") => {
  if (value === undefined || value === null) return fallback;
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
  ].map((part) => part?.trim()).filter(Boolean);
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
  if (category.startsWith("shop=")) return category.replace("shop=", "");
  if (category.startsWith("amenity=")) return category.replace("amenity=", "");
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

  if (data.businessName) tags.name = data.businessName;

  if (data.category) {
    if (data.category.startsWith("shop=")) {
      tags.shop = data.category.replace("shop=", "");
    } else if (data.category.startsWith("amenity=")) {
      tags.amenity = data.category.replace("amenity=", "");
    } else {
      tags.shop = data.category;
    }
  }

  if (data.description) tags.description = data.description;
  if (data.housenumber) tags["addr:housenumber"] = data.housenumber;
  if (data.street) tags["addr:street"] = data.street;
  if (data.suburb) tags["addr:suburb"] = data.suburb;
  if (data.postcode) tags["addr:postcode"] = data.postcode;
  if (data.state) tags["addr:state"] = data.state;
  if (data.city) tags["addr:city"] = data.city;

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

  if (data.openingHours) tags["opening_hours"] = data.openingHours;
  if (data.wheelchair) tags["wheelchair"] = data.wheelchair;

  tags["check_date"] = today;

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

function mergeTags(existingTags: Record<string, string>, formTags: Record<string, string>): Record<string, string> {
  const merged = { ...existingTags };
  for (const [key, value] of Object.entries(formTags)) {
    merged[key] = value;
  }
  return merged;
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
    // data contains the edited fields from the admin form
    // strategy determines if we update existing or create new
    const { data, strategy, duplicateOsmId, duplicateOsmType } = body;

    // 1. Get current submission from DB
    const submission = await prisma.submission.findUnique({ where: { id } });
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // 2. Build OSM tags from the (potentially edited) data
    const formTags = buildTagsFromForm({
      businessName: data.businessName,
      description: data.description,
      category: data.category,
      housenumber: data.housenumber,
      street: data.street,
      suburb: data.suburb,
      postcode: data.postcode,
      state: data.state,
      city: data.city,
      phone: data.phone,
      website: data.website,
      email: data.email,
      facebook: data.facebook,
      instagram: data.instagram,
      openingHours: data.openingHours,
      wheelchair: data.wheelchair,
      bitcoinDetails: data.bitcoinDetails,
    });

    let osmNodeId: number;
    let osmNodeUrl: string;
    let changesetId: number;
    let elementVersion: number = 1;

    // 3. Perform OSM Operation based on strategy
    if (strategy === "update" && duplicateOsmId && duplicateOsmType) {
      // UPDATE EXISTING
      const osmId = parseInt(duplicateOsmId);
      changesetId = await openChangeset("Updated Bitcoin-accepting business via Aussie Bitcoin Merchants (Admin Review)");

      let mergedTags: Record<string, string>;
      let elementId: number;
      let wayNodes: number[] | null = null;
      let nodeLat: number | null = null;
      let nodeLon: number | null = null;

      if (duplicateOsmType === "way") {
        const existingWay = await fetchWay(osmId);
        mergedTags = mergeTags(existingWay.tags, formTags);
        elementVersion = existingWay.version;
        elementId = existingWay.id;
        wayNodes = existingWay.nodes;
      } else {
        const existingNode = await fetchNode(osmId);
        mergedTags = mergeTags(existingNode.tags, formTags);
        elementVersion = existingNode.version;
        elementId = existingNode.id;
        nodeLat = existingNode.lat;
        nodeLon = existingNode.lon;
      }

      if (duplicateOsmType === "way" && wayNodes) {
        await updateWay(elementId, { tags: mergedTags, nodes: wayNodes }, elementVersion, changesetId);
      } else if (nodeLat !== null && nodeLon !== null) {
        await updateNode(elementId, { lat: nodeLat, lon: nodeLon, tags: mergedTags }, elementVersion, changesetId);
      } else {
        throw new Error("Invalid element type or missing data for update");
      }

      osmNodeId = elementId;
      osmNodeUrl = `https://www.openstreetmap.org/${duplicateOsmType}/${elementId}`;
      elementVersion++; // Version increments after update

    } else {
      // CREATE NEW NODE
      changesetId = await openChangeset("Added Bitcoin-accepting business via Aussie Bitcoin Merchants (Admin Review)");
      
      osmNodeId = await createNode(
        {
          lat: data.latitude || 0,
          lon: data.longitude || 0,
          tags: formTags,
        },
        changesetId
      );
      osmNodeUrl = `https://www.openstreetmap.org/node/${osmNodeId}`;
    }

    await closeChangeset(changesetId);

    // 4. Update Submission in DB
    // Update fields with what was actually submitted (in case admin edited)
    await prisma.submission.update({
      where: { id },
      data: {
        status: "uploaded",
        businessName: data.businessName,
        description: data.description,
        category: data.category,
        street: data.street,
        housenumber: data.housenumber,
        suburb: data.suburb,
        postcode: data.postcode,
        state: data.state,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        phone: data.phone,
        website: data.website,
        email: data.email,
        facebook: data.facebook,
        instagram: data.instagram,
        bitcoinDetails: data.bitcoinDetails,
        openingHours: data.openingHours,
        wheelchair: data.wheelchair,
        notes: data.notes,
      },
    });

    // 5. Create OSM Node Record
    await prisma.osmNode.create({
      data: {
        osmId: BigInt(osmNodeId),
        submissionId: id,
        changesetId: BigInt(changesetId),
        version: elementVersion,
        uploadedAt: new Date(),
      },
    });

    // 6. Send Notification Email
    const submissionEmailDetails: SubmissionEmailDetails = {
        businessName: data.businessName,
        description: data.description,
        category: data.category,
        housenumber: data.housenumber,
        street: data.street,
        suburb: data.suburb,
        postcode: data.postcode,
        state: data.state,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        phone: data.phone,
        website: data.website,
        email: data.email,
        facebook: data.facebook,
        instagram: data.instagram,
        openingHours: data.openingHours,
        wheelchair: data.wheelchair,
        notes: data.notes,
        bitcoinDetails: data.bitcoinDetails,
    };

    try {
        await sendSubmissionNotification({
            submissionId: id,
            osmNodeId,
            osmNodeUrl,
            details: submissionEmailDetails,
        });
    } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
    }

    return NextResponse.json({ success: true, osmNodeUrl });

  } catch (error: any) {
    console.error("Approval error:", error);
    return NextResponse.json(
      { error: "Failed to approve submission", details: error.message },
      { status: 500 }
    );
  }
}

