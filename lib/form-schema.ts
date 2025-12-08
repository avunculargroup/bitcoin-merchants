import type { FormValues } from "@/lib/form-validation";

export type QuestionId =
  | "businessSearch"
  | "businessName"
  | "description"
  | "category"
  | "addressStreet"
  | "addressLocation"
  | "bitcoinMethods"
  | "lightningOperator"
  | "acceptanceLocations"
  | "otherAcceptance"
  | "optionalPrompt"
  | "contactInfo"
  | "socialLinks"
  | "openingHours"
  | "accessibility"
  | "notes"
  | "licenseAndAltcha"
  | "review";

type QuestionType = "text" | "textarea" | "select" | "custom";

type QuestionDependency = {
  field: keyof FormValues;
  equals: unknown;
};

export type QuestionDefinition = {
  id: QuestionId;
  section: string;
  title: string;
  description?: string;
  type: QuestionType;
  fields: (keyof FormValues)[];
  placeholder?: string;
  options?: { label: string; value: string }[];
  isOptional?: boolean;
  category?: "core" | "optional";
  component?: string;
  dependencies?: QuestionDependency[];
};

export const CATEGORY_OPTIONS = [
  { label: "Retail", value: "shop=retail" },
  { label: "Cafe", value: "amenity=cafe" },
  { label: "Restaurant", value: "amenity=restaurant" },
  { label: "Supermarket", value: "shop=supermarket" },
  { label: "Clothing", value: "shop=clothes" },
  { label: "Electronics", value: "shop=electronics" },
  { label: "Bar", value: "amenity=bar" },
  { label: "Pub", value: "amenity=pub" },
  { label: "Convenience Store", value: "shop=convenience" },
  { label: "Other", value: "other" },
];

export const LIGHTNING_OPERATOR_OPTIONS = [
  { label: "Square", value: "square" },
  { label: "WOS", value: "wos" },
  { label: "Bitaroo", value: "bitaroo" },
  { label: "Other", value: "other" },
];

export const OTHER_ACCEPTANCE_OPTIONS = [
  { label: "Gift cards / vouchers", value: "Gift cards / vouchers" },
  { label: "Donation jar / tips", value: "Bitcoin donations" },
  { label: "Workshops or education", value: "Workshops / education" },
  { label: "Pop-up events", value: "Pop-up events" },
  { label: "Peer-to-peer services", value: "Peer-to-peer services" },
];

export const questions: QuestionDefinition[] = [
  {
    id: "businessSearch",
    section: "Prefill",
    title: "Search for your business",
    description: "Optional lookup powered by Google Places to speed things up.",
    type: "custom",
    fields: [],
    component: "businessSearch",
  },
  {
    id: "businessName",
    section: "Business",
    title: "What is the business name?",
    type: "text",
    fields: ["businessName"],
    placeholder: "Satoshi's Coffee",
  },
  {
    id: "description",
    section: "Business",
    title: "Describe the business",
    description: "Tell us what makes this venue unique (optional).",
    type: "textarea",
    fields: ["description"],
    placeholder: "Independent espresso bar serving local beans...",
  },
  {
    id: "category",
    section: "Business",
    title: "Choose a category",
    type: "select",
    fields: ["category"],
    options: CATEGORY_OPTIONS,
  },
  {
    id: "addressStreet",
    section: "Address",
    title: "Street address",
    description: "We’ll split house number and street for OSM formatting.",
    type: "custom",
    fields: ["housenumber", "street"],
    component: "addressStreet",
  },
  {
    id: "addressLocation",
    section: "Address",
    title: "Suburb, city & postcode",
    type: "custom",
    fields: ["suburb", "city", "state", "postcode"],
    component: "addressLocation",
  },
  {
    id: "bitcoinMethods",
    section: "Bitcoin",
    title: "How do you accept Bitcoin?",
    description: "Select all that apply. At least one method is required.",
    type: "custom",
    fields: ["onChain", "lightning", "lightningContactless"],
    component: "bitcoinMethods",
  },
  {
    id: "lightningOperator",
    section: "Bitcoin",
    title: "Who operates your Lightning setup?",
    description: "We share this info with merchants so they can support each other.",
    type: "custom",
    fields: ["lightningOperator", "lightningOperatorOther"],
    component: "lightningOperator",
    dependencies: [{ field: "lightning", equals: true }],
  },
  {
    id: "acceptanceLocations",
    section: "Bitcoin",
    title: "Where can people pay?",
    type: "custom",
    fields: ["inStore", "online"],
    component: "acceptanceLocations",
  },
  {
    id: "otherAcceptance",
    section: "Bitcoin",
    title: "Other Bitcoin-friendly perks",
    description: "Optional extras like gift cards, pop-ups, or education.",
    type: "custom",
    fields: ["other"],
    component: "otherAcceptance",
  },
  {
    id: "optionalPrompt",
    section: "Details",
    title: "Add optional details?",
    description: "Contact info, socials, accessibility and notes.",
    type: "custom",
    fields: ["includeOptionalDetails"],
    component: "optionalPrompt",
  },
  {
    id: "contactInfo",
    section: "Optional",
    title: "Contact details",
    description: "Phone, website and email help customers reach you.",
    type: "custom",
    fields: ["phone", "website", "email"],
    component: "contactInfo",
    category: "optional",
  },
  {
    id: "socialLinks",
    section: "Optional",
    title: "Social links",
    type: "custom",
    fields: ["facebook", "instagram"],
    component: "socialLinks",
    category: "optional",
  },
  {
    id: "openingHours",
    section: "Optional",
    title: "Opening hours",
    type: "custom",
    fields: ["openingHours"],
    component: "openingHours",
    category: "optional",
  },
  {
    id: "accessibility",
    section: "Optional",
    title: "Accessibility",
    type: "custom",
    fields: ["wheelchair"],
    component: "accessibility",
    category: "optional",
  },
  {
    id: "notes",
    section: "Optional",
    title: "Anything else we should know?",
    type: "textarea",
    fields: ["notes"],
    placeholder: "Example: Bitcoin discount on Tuesdays",
    category: "optional",
  },
  {
    id: "licenseAndAltcha",
    section: "Verification",
    title: "License & verification",
    description: "ODbL agreement plus spam protection.",
    type: "custom",
    fields: ["licenseAgreement"],
    component: "licenseAndAltcha",
  },
  {
    id: "review",
    section: "Review",
    title: "Review & submit",
    type: "custom",
    fields: [],
    component: "review",
  },
];

export const OPTIONAL_FIELD_IDS: (keyof FormValues)[] = [
  "phone",
  "website",
  "email",
  "facebook",
  "instagram",
  "openingHours",
  "wheelchair",
  "notes",
];

type FilterQuestionsArgs = {
  includeOptional: boolean;
  values: FormValues;
};

export const filterQuestions = ({ includeOptional, values }: FilterQuestionsArgs) =>
  questions.filter((question) => {
    if (question.category === "optional" && !includeOptional) {
      return false;
    }

    if (!question.dependencies?.length) {
      return true;
    }

    return question.dependencies.every((dependency) => {
      const fieldValue = values[dependency.field];
      return fieldValue === dependency.equals;
    });
  });

