import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { normalizeAddress } from "@/lib/geocode-utils";

interface NominatimResponse {
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    municipality?: string;
    postcode?: string;
    state?: string;
    state_district?: string;
  };
}

const MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests
const CACHE_TTL_DAYS = 30; // Cache results for 30 days

/**
 * Global rate limiter using database to ensure 1 request per second across all instances
 * Returns false if rate limiting fails (non-critical)
 */
async function enforceRateLimit(): Promise<boolean> {
  try {
    const now = new Date();
    
    // Use a transaction with row-level locking to ensure atomicity
    // This ensures only one request per second globally, even across multiple server instances
    const rateLimitRecord = await prisma.$transaction(async (tx) => {
      // Try to get or create the rate limit record
      let record = await tx.geocodingRateLimit.findFirst();
      
      if (!record) {
        // Create the initial record if it doesn't exist
        record = await tx.geocodingRateLimit.create({
          data: {
            lastRequestTime: new Date(0), // Start from epoch to allow first request
          },
        });
      }
      
      // Calculate time since last request
      const timeSinceLastRequest = now.getTime() - record.lastRequestTime.getTime();
      
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        // We need to wait
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      // Update the last request time
      return await tx.geocodingRateLimit.update({
        where: { id: record.id },
        data: { lastRequestTime: new Date() },
      });
    });
    
    return true;
  } catch (error) {
    // If rate limiting fails, log but continue (non-critical)
    console.warn("Rate limiting failed, continuing without rate limit:", error);
    return false;
  }
}

/**
 * Check cache for existing geocoding result
 * Returns null if cache check fails (non-critical)
 */
async function getCachedResult(normalizedAddress: string): Promise<null | {
  latitude: number;
  longitude: number;
  address: {
    street: string;
    suburb: string;
    postcode: string;
    state: string;
    city: string;
  };
  cached: boolean;
}> {
  try {
    const cached = await prisma.geocodingCache.findUnique({
      where: { normalizedAddress },
    });
    
    if (cached && cached.expiresAt > new Date()) {
      // Cache hit and not expired
      return {
        latitude: cached.latitude,
        longitude: cached.longitude,
        address: cached.addressData as {
          street: string;
          suburb: string;
          postcode: string;
          state: string;
          city: string;
        },
        cached: true,
      };
    }
    
    // Cache miss or expired - clean up expired entry
    if (cached && cached.expiresAt <= new Date()) {
      try {
        await prisma.geocodingCache.delete({
          where: { normalizedAddress },
        });
      } catch (error) {
        // Ignore cleanup errors
        console.warn("Failed to clean up expired cache entry:", error);
      }
    }
    
    return null;
  } catch (error: any) {
    // If cache check fails (including database connection errors), return null
    // Check for specific Prisma connection errors
    if (error?.message?.includes("Can't reach database") || 
        error?.message?.includes("database server") ||
        error?.code === "P1001" ||
        error?.code === "P1017" ||
        error?.name === "PrismaClientInitializationError") {
      // Database connection issue - silently skip cache
      return null;
    }
    // Other errors - log but continue
    console.warn("Cache check failed, continuing without cache:", error?.message || error);
    return null;
  }
}

/**
 * Store geocoding result in cache
 * Fails silently if caching fails (non-critical)
 */
async function cacheResult(
  normalizedAddress: string,
  latitude: number,
  longitude: number,
  addressData: {
    street: string;
    suburb: string;
    postcode: string;
    state: string;
    city: string;
  }
) {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);
    
    await prisma.geocodingCache.upsert({
      where: { normalizedAddress },
      create: {
        normalizedAddress,
        latitude,
        longitude,
        addressData,
        expiresAt,
      },
      update: {
        latitude,
        longitude,
        addressData,
        expiresAt,
      },
    });
  } catch (error) {
    // If caching fails, log but continue (non-critical)
    console.warn("Failed to cache geocoding result:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    // Normalize address for consistent caching
    const normalizedAddress = normalizeAddress(address);
    
    // Check cache first (non-critical - if database fails, continue without cache)
    try {
      const cachedResult = await getCachedResult(normalizedAddress);
      if (cachedResult) {
        return NextResponse.json({
          latitude: cachedResult.latitude,
          longitude: cachedResult.longitude,
          address: cachedResult.address,
          attribution: "Geocoding by OpenStreetMap Nominatim",
          cached: true,
        });
      }
    } catch (cacheError: any) {
      // Cache check failed (including DB connection errors), continue without cache
      // Don't log Prisma connection errors as they're expected if DB is unavailable
      if (!cacheError?.message?.includes("Can't reach database") && 
          !cacheError?.name?.includes("PrismaClient")) {
        console.warn("Cache check error (non-critical):", cacheError?.message || cacheError);
      }
    }

    // Enforce global rate limit (non-critical - if it fails, continue without rate limiting)
    try {
      await enforceRateLimit();
    } catch (rateLimitError: any) {
      // Rate limiting failed, continue without rate limiting
      // Don't log Prisma connection errors as they're expected if DB is unavailable
      if (!rateLimitError?.message?.includes("Can't reach database") && 
          !rateLimitError?.name?.includes("PrismaClient")) {
        console.warn("Rate limiting error (non-critical):", rateLimitError?.message || rateLimitError);
      }
    }

    // Call Nominatim API for OSM-licensed geocoding
    // Note: Nominatim requires a delay between requests (1 request per second)
    // and proper User-Agent header with contact email
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=au&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Aussie-Bitcoin-Merchants/1.0 (info@bitcoinmerchants.com.au)",
          "Referer": env.appUrl,
          "Accept-Language": "en-AU,en",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Nominatim API error:", response.status, errorText);
      
      // If it's a 403, we might be rate limited - return a more helpful error
      if (response.status === 403) {
        return NextResponse.json(
          { 
            error: "Rate limit exceeded. Please try again in a moment.",
            details: "Nominatim usage policy requires 1 request per second maximum.",
          },
          { status: 429 }
        );
      }
      
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data: NominatimResponse[] = await response.json();

    if (!data || data.length === 0) {
      console.warn("Nominatim: Address not found for:", address);
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    const result = data[0];
    
    // Nominatim returns address components in a nested structure
    const addressData = result.address || {};
    
    const formattedAddress = {
      street: addressData.road || addressData.house_number ? 
        `${addressData.house_number || ""} ${addressData.road || ""}`.trim() : "",
      suburb: addressData.suburb || addressData.village || addressData.town || "",
      postcode: addressData.postcode || "",
      state: addressData.state || addressData.state_district || "",
      city: addressData.city || addressData.town || addressData.municipality || addressData.suburb || "",
    };
    
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    
    // Cache the result (only if database is available)
    if (databaseAvailable) {
      await cacheResult(normalizedAddress, latitude, longitude, formattedAddress);
    }
    
    return NextResponse.json({
      latitude,
      longitude,
      address: formattedAddress,
      attribution: "Geocoding by OpenStreetMap Nominatim",
      cached: false,
    });
  } catch (error: any) {
    // If it's a database error, log it but don't fail the request
    // Geocoding can work without database (cache/rate limiting are non-critical)
    if (error?.message?.includes("Can't reach database") || 
        error?.message?.includes("database server") ||
        error?.code === "P1001" || // Prisma connection error
        error?.code === "P1017") {  // Prisma server closed connection
      console.warn("Database connection error (non-critical, continuing without cache):", error.message);
      // Don't return error - let the caller handle it gracefully
      // The frontend already handles geocoding failures as non-critical
      return NextResponse.json(
        { error: "Geocoding temporarily unavailable" },
        { status: 503 }
      );
    }
    
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to geocode address" },
      { status: 500 }
    );
  }
}

