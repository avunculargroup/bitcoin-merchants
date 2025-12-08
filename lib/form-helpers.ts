export const websiteDomainPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;

export const normalizeWebsite = (value?: string | null): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^http:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

export const parseStreetAddress = (streetValue: string): { houseNumber: string; street: string } => {
  if (!streetValue || !streetValue.trim()) {
    return { houseNumber: "", street: "" };
  }

  const trimmed = streetValue.trim();
  const houseNumberPattern = /^(\d+[A-Za-z]?(?:\s*[-/]\s*\d+[A-Za-z]?)?)\s+(.+)$/;
  const match = trimmed.match(houseNumberPattern);

  if (match && match[1] && match[2]) {
    return {
      houseNumber: match[1].trim(),
      street: match[2].trim(),
    };
  }

  return { houseNumber: "", street: trimmed };
};

export type ReviewDataInput = {
  businessName?: string;
  description?: string;
  category?: string;
  housenumber?: string | null;
  street?: string | null;
  suburb?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  onChain?: boolean;
  lightning?: boolean;
  lightningContactless?: boolean;
  other?: string[];
  lightningOperator?: string | null;
  lightningOperatorOther?: string | null;
  inStore?: boolean;
  online?: boolean;
  openingHours?: string | null;
  wheelchair?: string | null;
  notes?: string | null;
};

const formatCategoryLabel = (category?: string) => {
  if (!category) return "Not provided";
  if (category.startsWith("shop=")) {
    return category.replace("shop=", "");
  }
  if (category.startsWith("amenity=")) {
    return category.replace("amenity=", "");
  }
  return category;
};

export const formatReviewData = (data: ReviewDataInput) => {
  const bitcoinMethods: string[] = [];
  if (data.onChain) bitcoinMethods.push("On-chain Bitcoin");
  if (data.lightning) bitcoinMethods.push("Lightning Network");
  if (data.lightningContactless) bitcoinMethods.push("Lightning Contactless");
  if (data.other && data.other.length > 0) bitcoinMethods.push(...data.other);

  const acceptanceLocations: string[] = [];
  if (data.inStore) acceptanceLocations.push("In-store");
  if (data.online) acceptanceLocations.push("Online");

  const addressParts = [
    data.housenumber,
    data.street,
    data.suburb,
    data.city,
    data.state,
    data.postcode,
  ]
    .map((part) => (typeof part === "string" ? part.trim() : part))
    .filter(Boolean);

  const coordinates =
    typeof data.latitude === "number" && typeof data.longitude === "number"
      ? `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`
      : "Not provided";

  const lightningOperator =
    data.lightningOperator === "other"
      ? data.lightningOperatorOther
      : data.lightningOperator;

  return {
    businessName: data.businessName,
    description: data.description,
    category: formatCategoryLabel(data.category),
    address: addressParts.length > 0 ? addressParts.join(", ") : "Not provided",
    coordinates,
    phone: data.phone || "Not provided",
    website: data.website || "Not provided",
    email: data.email || "Not provided",
    facebook: data.facebook || "Not provided",
    instagram: data.instagram || "Not provided",
    bitcoinMethods: bitcoinMethods.length > 0 ? bitcoinMethods.join(", ") : "None selected",
    lightningOperator: lightningOperator || "Not provided",
    acceptanceLocations: acceptanceLocations.length > 0 ? acceptanceLocations.join(", ") : "None selected",
    openingHours: data.openingHours || "Not provided",
    wheelchair: data.wheelchair || "Not provided",
    notes: data.notes || "Not provided",
  };
};

