import { NextRequest, NextResponse } from "next/server";

type OsmElementType = "node" | "way";

interface OverpassElement {
  type: OsmElementType;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

interface DuplicateMatch {
  osmId: number;
  osmType: OsmElementType;
  name?: string;
  category?: string;
  tags: Record<string, string>;
  matchReason: "bitcoin_tagged" | "similar_name";
  coordinates?: { lat: number; lon: number };
  changesetId?: number;
  lastUpdated?: string;
}

/**
 * Extract meaningful keywords from a business name
 * Removes common words and punctuation, returns significant words
 */
function extractKeywords(businessName: string): string[] {
  if (!businessName) return [];
  
  // Common words to ignore
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this',
    'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    's', 't', 'll', 've', 're', 'd', 'm', 'n', 'shop', 'store', 'business'
  ]);
  
  // Normalize: lowercase, remove punctuation, split into words
  const normalized = businessName
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Extract words (minimum 3 characters) that aren't stop words
  const words = normalized
    .split(' ')
    .filter(word => word.length >= 3 && !stopWords.has(word));
  
  return words;
}

/**
 * Build Overpass regex pattern for name matching
 * Creates a pattern that matches if any keyword appears in the name
 * Overpass syntax: ["name"~"pattern",i] for case-insensitive
 */
function buildNameRegex(keywords: string[]): string {
  if (keywords.length === 0) return '';
  
  // Escape special regex characters and create alternation pattern
  // Use word boundaries to match whole words or parts
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // Match if any keyword appears in the name (case-insensitive)
  return `~"${escaped.join('|')}",i`;
}

const CATEGORY_TAGS = ["amenity", "shop", "tourism", "leisure", "craft", "office", "man_made"];
const BITCOIN_TAGS = ["currency:XBT", "payment:bitcoin", "bitcoin:accepts"];

function determineMatchReason(tags: Record<string, string>): "bitcoin_tagged" | "similar_name" {
  const hasBitcoinTag = BITCOIN_TAGS.some((key) => {
    if (key === "bitcoin:accepts") {
      return tags[key] === "yes";
    }
    return Boolean(tags[key]);
  });
  return hasBitcoinTag ? "bitcoin_tagged" : "similar_name";
}

function determineCategory(tags: Record<string, string>): string | undefined {
  for (const key of CATEGORY_TAGS) {
    if (tags[key]) {
      return `${key}=${tags[key]}`;
    }
  }
  return undefined;
}

async function fetchChangesetMetadata(element: OverpassElement) {
  const elementType = element.type === "way" ? "way" : "node";

  try {
    const elementResponse = await fetch(
      `https://api.openstreetmap.org/api/0.6/${elementType}/${element.id}`,
      {
        headers: {
          "User-Agent": "Aussie-Bitcoin-Merchants/1.0",
        },
      }
    );

    if (!elementResponse.ok) {
      return { changesetId: undefined, timestamp: null };
    }

    const elementXml = await elementResponse.text();
    const changesetMatch = elementXml.match(/changeset="(\d+)"/);
    if (!changesetMatch) {
      return { changesetId: undefined, timestamp: null };
    }

    const changesetId = parseInt(changesetMatch[1], 10);

    const changesetResponse = await fetch(
      `https://api.openstreetmap.org/api/0.6/changeset/${changesetId}`,
      {
        headers: {
          "User-Agent": "Aussie-Bitcoin-Merchants/1.0",
        },
      }
    );

    if (!changesetResponse.ok) {
      return { changesetId, timestamp: null };
    }

    const changesetXml = await changesetResponse.text();
    const timestampMatch = changesetXml.match(/created_at="([^"]+)"/);
    const timestamp = timestampMatch ? new Date(timestampMatch[1]) : null;

    return { changesetId, timestamp };
  } catch (error) {
    console.warn(`Failed to fetch changeset info for ${element.type} ${element.id}:`, error);
    return { changesetId: undefined, timestamp: null };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude, businessName } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Coordinates are required" },
        { status: 400 }
      );
    }

    // Extract keywords from business name for name-based matching
    const keywords = businessName ? extractKeywords(businessName) : [];
    const nameRegex = keywords.length > 0 ? buildNameRegex(keywords) : '';

    // Build Overpass query
    // Check for nodes and ways with bitcoin tags OR similar names within 25m radius
    let overpassQuery = `
      [out:json][timeout:25];
      (
    `;

    // Check for bitcoin-tagged nodes and ways (existing logic)
    overpassQuery += `
        node["currency:XBT"](around:25,${latitude},${longitude});
        node["payment:bitcoin"](around:25,${latitude},${longitude});
        node["bitcoin:accepts"="yes"](around:25,${latitude},${longitude});
        way["currency:XBT"](around:25,${latitude},${longitude});
        way["payment:bitcoin"](around:25,${latitude},${longitude});
        way["bitcoin:accepts"="yes"](around:25,${latitude},${longitude});
    `;

    // If we have keywords, also check for similar names in the area
    if (nameRegex) {
      // Search for nodes/ways with similar names (case-insensitive partial match)
      // Overpass syntax: ["name"~"pattern",i]
      overpassQuery += `
        node["name"${nameRegex}](around:25,${latitude},${longitude});
        way["name"${nameRegex}](around:25,${latitude},${longitude});
      `;
    }

    overpassQuery += `
      );
      out center body;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) {
      throw new Error("Overpass API error");
    }

    const data: OverpassResponse = await response.json();

    if (data.elements && data.elements.length > 0) {
      const matchResults = await Promise.all(
        data.elements.map(async (element) => {
          const tags = element.tags || {};
          const coordinates = element.center ||
            (element.lat !== undefined && element.lon !== undefined
              ? { lat: element.lat, lon: element.lon }
              : undefined);
          const { changesetId, timestamp } = await fetchChangesetMetadata(element);

          const match: DuplicateMatch = {
            osmId: element.id,
            osmType: element.type,
            name: tags.name,
            category: determineCategory(tags),
            tags,
            matchReason: determineMatchReason(tags),
            coordinates,
            changesetId,
            lastUpdated: timestamp ? timestamp.toISOString() : undefined,
          };

          return { match, element, timestamp };
        })
      );

      if (matchResults.length === 0) {
        return NextResponse.json({ isDuplicate: false });
      }

      let primaryResult = matchResults[0];
      for (const result of matchResults) {
        if (result.timestamp && (!primaryResult.timestamp || result.timestamp > primaryResult.timestamp)) {
          primaryResult = result;
        }
      }

      const sortedMatches = matchResults
        .slice()
        .sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            return b.timestamp.getTime() - a.timestamp.getTime();
          }
          if (a.timestamp) return -1;
          if (b.timestamp) return 1;
          return 0;
        })
        .map((result) => result.match);

      return NextResponse.json({
        isDuplicate: true,
        osmId: primaryResult.match.osmId,
        osmType: primaryResult.match.osmType,
        existingElement: primaryResult.element,
        matchReason: primaryResult.match.matchReason,
        coordinates: primaryResult.match.coordinates,
        matches: sortedMatches,
      });
    }

    return NextResponse.json({ isDuplicate: false });
  } catch (error) {
    console.error("Duplicate detection error:", error);
    // Don't fail the request if Overpass is down, just log it
    return NextResponse.json({ isDuplicate: false, error: "Check failed" });
  }
}

