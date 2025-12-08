import { describe, expect, it } from "vitest";

import { buildNostrEvent } from "@/lib/nostr/event-builder";
import type { PublishTrigger, Submission } from "@prisma/client";

const createSubmission = (overrides: Partial<Submission> = {}): Submission => {
  const base: Submission = {
    id: "test-submission-id",
    status: "pending",
    businessName: "Test Merchant",
    description: null,
    category: "shop=cafe",
    street: "Main Street",
    housenumber: "10",
    suburb: "Sydney",
    postcode: "2000",
    state: "NSW",
    city: "Sydney",
    latitude: -33.865143,
    longitude: 151.2099,
    phone: null,
    website: "https://example.com",
    email: null,
    facebook: null,
    instagram: null,
    bitcoinDetails: {
      lightning: true,
      onChain: true,
      inStore: true,
    } as any,
    openingHours: null,
    wheelchair: null,
    notes: "<b>Great coffee</b>",
    userEmail: null,
    duplicateOsmId: null,
    duplicateOsmType: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { ...base, ...overrides };
};

describe("buildNostrEvent", () => {
  it("includes submission metadata tags", () => {
    const submission = createSubmission();
    const result = buildNostrEvent({
      submission,
      trigger: "submission" as PublishTrigger,
    });

    expect(result.kind).toBe(1);
    expect(result.tags).toContainEqual(["submissionId", submission.id]);
    expect(result.tags).toContainEqual(["trigger", "submission"]);
    expect(result.tags).toContainEqual(["city", submission.city]);
    expect(result.tags).toContainEqual([
      "geo",
      `${submission.latitude},${submission.longitude}`,
    ]);
  });

  it("sanitizes user content and enforces max length", () => {
    const submission = createSubmission({
      businessName: "Cafe <script>alert('x')</script>",
      notes: "A".repeat(600),
    });
    const result = buildNostrEvent({
      submission,
      trigger: "approval" as PublishTrigger,
    });

    expect(result.content.length).toBeLessThanOrEqual(500);
    expect(result.content).not.toContain("<script>");
  });
});
