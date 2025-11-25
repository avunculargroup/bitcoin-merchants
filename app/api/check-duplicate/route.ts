import { NextRequest, NextResponse } from "next/server";

interface OverpassResponse {
  elements: Array<{
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: {
      name?: string;
      "currency:XBT"?: string;
      "payment:bitcoin"?: string;
      "bitcoin:accepts"?: string;
    };
  }>;
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
      // Find the best matching duplicate
      // Prioritize: 1) Bitcoin-tagged items, 2) Name matches
      let bestMatch = data.elements[0];
      let bestScore = 0;

      for (const element of data.elements) {
        let score = 0;
        const tags = element.tags || {};
        
        // Higher score for bitcoin-tagged items
        if (tags['currency:XBT'] || tags['payment:bitcoin'] || tags['bitcoin:accepts']) {
          score += 10;
        }
        
        // Score for name similarity
        if (tags.name && businessName) {
          const elementName = tags.name.toLowerCase();
          const searchName = businessName.toLowerCase();
          
          // Exact match gets highest score
          if (elementName === searchName) {
            score += 20;
          } else {
            // Check if keywords match
            const elementKeywords = extractKeywords(tags.name);
            const searchKeywords = extractKeywords(businessName);
            const matchingKeywords = elementKeywords.filter(k => 
              searchKeywords.some(sk => sk.includes(k) || k.includes(sk))
            );
            score += matchingKeywords.length * 2;
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = element;
        }
      }

      // Get coordinates (for ways, use center; for nodes, use lat/lon)
      const coords = bestMatch.center || 
        (bestMatch.lat && bestMatch.lon ? { lat: bestMatch.lat, lon: bestMatch.lon } : null);

      return NextResponse.json({
        isDuplicate: true,
        osmId: bestMatch.id,
        osmType: bestMatch.type,
        existingElement: bestMatch,
        matchReason: bestMatch.tags?.['currency:XBT'] || bestMatch.tags?.['payment:bitcoin'] 
          ? 'bitcoin_tagged' 
          : 'similar_name',
        coordinates: coords,
      });
    }

    return NextResponse.json({ isDuplicate: false });
  } catch (error) {
    console.error("Duplicate detection error:", error);
    // Don't fail the request if Overpass is down, just log it
    return NextResponse.json({ isDuplicate: false, error: "Check failed" });
  }
}

