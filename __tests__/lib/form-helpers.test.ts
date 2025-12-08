import { describe, expect, it } from "vitest";
import { formatReviewData, normalizeWebsite, parseStreetAddress } from "../../lib/form-helpers";

describe("normalizeWebsite", () => {
  it("returns undefined for empty input", () => {
    expect(normalizeWebsite(" ")).toBeUndefined();
    expect(normalizeWebsite(undefined)).toBeUndefined();
  });

  it("forces https for http urls", () => {
    expect(normalizeWebsite("http://example.com")).toBe("https://example.com");
  });

  it("adds https prefix when missing", () => {
    expect(normalizeWebsite("example.com")).toBe("https://example.com");
  });
});

describe("parseStreetAddress", () => {
  it("splits house number and street when possible", () => {
    const parsed = parseStreetAddress("218-220 Bitcoin Street");
    expect(parsed.houseNumber).toBe("218-220");
    expect(parsed.street).toBe("Bitcoin Street");
  });

  it("falls back to full string when no number is present", () => {
    const parsed = parseStreetAddress("Lightning Lane");
    expect(parsed.houseNumber).toBe("");
    expect(parsed.street).toBe("Lightning Lane");
  });
});

describe("formatReviewData", () => {
  it("builds human readable summaries", () => {
    const summary = formatReviewData({
      businessName: "Node Cafe",
      category: "amenity=cafe",
      housenumber: "42",
      street: "Chain St",
      suburb: "Satoshi",
      city: "Sydney",
      state: "NSW",
      postcode: "2000",
      onChain: true,
      lightning: true,
      lightningOperator: "square",
      other: ["Gift cards"],
      inStore: true,
      website: "https://node.cafe",
    });

    expect(summary.address).toContain("Chain St");
    expect(summary.bitcoinMethods).toContain("Lightning Network");
    expect(summary.acceptanceLocations).toContain("In-store");
  });
});
