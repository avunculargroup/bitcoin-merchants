import fs from "node:fs";
import path from "node:path";

import type { PublishTrigger, Submission } from "@prisma/client";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "app",
  "content",
  "NOSTR_TEMPLATE.md",
);
const MAX_CONTENT_LENGTH = 500;

type BitcoinDetails = {
  onChain?: boolean;
  lightning?: boolean;
  lightningContactless?: boolean;
  other?: string[];
  inStore?: boolean;
  online?: boolean;
};

const sanitize = (value?: string | null) => {
  if (!value) {
    return "";
  }
  return value.replace(/[\u0000-\u001f<>]/g, "").trim();
};

const safeString = (value?: string | null, fallback = "Not specified") => {
  const sanitized = sanitize(value);
  return sanitized.length ? sanitized : fallback;
};

let templateCache: string | null = null;

function readTemplate(): string {
  if (templateCache) {
    return templateCache;
  }

  try {
    templateCache = fs.readFileSync(TEMPLATE_PATH, "utf-8");
    return templateCache;
  } catch {
    templateCache =
      "{{businessName}} in {{city}}, {{state}} accepts Bitcoin. Visit {{websiteOrPlaceholder}}.";
    return templateCache;
  }
}

function renderTemplate(
  template: string,
  replacements: Record<string, string>,
): string {
  return Object.entries(replacements).reduce((acc, [key, value]) => {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    return acc.replace(pattern, value);
  }, template);
}

function summarizeAcceptance(details: BitcoinDetails | undefined) {
  if (!details) {
    return "in-store";
  }

  const methods: string[] = [];
  if (details.onChain) methods.push("on-chain");
  if (details.lightning) methods.push("lightning");
  if (details.lightningContactless) methods.push("contactless");
  if (details.other && details.other.length) {
    methods.push(...details.other);
  }

  const contexts: string[] = [];
  if (details.inStore) contexts.push("in-store");
  if (details.online) contexts.push("online");

  const methodText = methods.length ? methods.join(" & ") : "Bitcoin";
  const contextText = contexts.length ? contexts.join(" & ") : "in-store";

  return `${methodText} ${contexts.length ? `for ${contextText}` : ""}`.trim();
}

function trimContent(content: string) {
  if (content.length <= MAX_CONTENT_LENGTH) {
    return content;
  }
  return `${content.slice(0, MAX_CONTENT_LENGTH - 1).trim()}…`;
}

export type EventBuilderInput = {
  submission: Submission;
  trigger: PublishTrigger;
  approvedBy?: string | null;
};

export type BuiltNostrEvent = {
  kind: number;
  content: string;
  tags: string[][];
};

export function buildNostrEvent({
  submission,
  trigger,
  approvedBy,
}: EventBuilderInput): BuiltNostrEvent {
  const bitcoinDetails = (submission.bitcoinDetails ?? {}) as BitcoinDetails;
  const formattedAddress = [
    submission.housenumber,
    submission.street,
    submission.suburb,
    submission.city,
    submission.state,
    submission.postcode,
  ]
    .map((value) => sanitize(value))
    .filter(Boolean)
    .join(", ");

  const templateVariables = {
    businessName: safeString(submission.businessName),
    formattedAddress: formattedAddress || "Australia",
    acceptanceSummary: summarizeAcceptance(bitcoinDetails),
    category: safeString(submission.category, "general retail"),
    city: safeString(submission.city, "Unknown city"),
    state: safeString(submission.state, "Unknown region"),
    lightningStatus: bitcoinDetails?.lightning ? "Yes" : "Not yet",
    notes: safeString(submission.notes, "No extra notes provided."),
    websiteOrPlaceholder: safeString(
      submission.website,
      "https://bitcoinmerchants.com.au",
    ),
  };

  const content = trimContent(
    renderTemplate(readTemplate(), templateVariables)
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );

  const tags: string[][] = [
    ["t", "business-onboarded"],
    ["t", "bitcoin"],
    ["d", `submission:${submission.id}`],
    ["submissionId", submission.id],
    ["trigger", trigger],
  ];

  if (submission.city) {
    tags.push(["city", sanitize(submission.city)]);
  }

  if (submission.state) {
    tags.push(["region", sanitize(submission.state)]);
  }

  if (submission.category) {
    tags.push(["category", sanitize(submission.category)]);
  }

  if (typeof submission.latitude === "number" && typeof submission.longitude === "number") {
    tags.push(["geo", `${submission.latitude},${submission.longitude}`]);
  }

  if (bitcoinDetails?.lightning) {
    tags.push(["payment", "lightning"]);
  }

  if (approvedBy) {
    tags.push(["approvedBy", sanitize(approvedBy)]);
  }

  return {
    kind: 1,
    content,
    tags,
  };
}
