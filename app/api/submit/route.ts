import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openChangeset, createNode, updateNode, closeChangeset } from "@/lib/osm";
import { rateLimit } from "@/lib/rate-limit";

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

    // Check for duplicates
    if (latitude && longitude) {
      const duplicateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/check-duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, businessName }),
      });
      const duplicateData = await duplicateResponse.json();

      if (duplicateData.isDuplicate) {
        // Store as duplicate
        const submission = await prisma.submission.create({
          data: {
            status: "duplicate",
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
            bitcoinDetails: bitcoinDetails || {},
            openingHours,
            wheelchair,
            notes,
            userEmail: email,
          },
        });

        return NextResponse.json({
          success: false,
          duplicate: true,
          submissionId: submission.id,
          existingOsmId: duplicateData.osmId,
          message: "A similar business already exists at this location.",
        });
      }
    }

    // Create submission in database
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
        website,
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

    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Build OSM tags
      const tags: Record<string, string> = {
        name: businessName,
      };

      if (category) {
        if (category.startsWith("shop=")) {
          tags.shop = category.replace("shop=", "");
        } else if (category.startsWith("amenity=")) {
          tags.amenity = category.replace("amenity=", "");
        } else {
          tags.shop = category;
        }
      }

      if (description) tags.description = description;
      if (housenumber) tags["addr:housenumber"] = housenumber;
      if (street) tags["addr:street"] = street;
      if (suburb) tags["addr:suburb"] = suburb;
      if (postcode) tags["addr:postcode"] = postcode;
      if (state) tags["addr:state"] = state;
      if (city) tags["addr:city"] = city;
      if (phone) {
        tags["contact:phone"] = phone;
        tags["phone"] = phone;
      }
      if (website) {
        tags["contact:website"] = website;
        tags["website"] = website;
      }
      if (email) {
        tags["contact:email"] = email;
        tags["email"] = email;
      }
      if (facebook) tags["contact:facebook"] = facebook;
      if (instagram) tags["contact:instagram"] = instagram;
      if (openingHours) tags["opening_hours"] = openingHours;
      if (wheelchair) tags["wheelchair"] = wheelchair;

      // Add check_date tag (always set to today)
      tags["check_date"] = today;

      // Bitcoin acceptance tags
      if (bitcoinDetails) {
        if (bitcoinDetails.onChain) {
          tags["currency:XBT"] = "yes";
          tags["payment:onchain"] = "yes";
          tags["check_date:currency:XBT"] = today;
        }
        if (bitcoinDetails.lightning) tags["payment:lightning"] = "yes";
        if (bitcoinDetails.lightningContactless) tags["payment:lightning_contactless"] = "yes";
        if (bitcoinDetails.lightningOperator) tags["payment:lightning:operator"] = bitcoinDetails.lightningOperator;
        if (bitcoinDetails.other && bitcoinDetails.other.length > 0) {
          tags["payment:bitcoin:other"] = bitcoinDetails.other.join(";");
        }
      }

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

      return NextResponse.json({
        success: true,
        submissionId: submission.id,
        osmNodeId,
        osmNodeUrl: `https://www.openstreetmap.org/node/${osmNodeId}`,
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

