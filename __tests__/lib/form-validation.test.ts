import { describe, expect, it } from "vitest";
import { formSchema } from "../../lib/form-validation";

describe("formSchema", () => {
  const basePayload = {
    businessName: "Cafe",
    category: "amenity=cafe",
    description: "",
    street: "",
    housenumber: "",
    suburb: "",
    postcode: "",
    state: "",
    city: "",
    latitude: undefined,
    longitude: undefined,
    phone: "",
    website: "",
    email: "",
    facebook: "",
    instagram: "",
    onChain: true,
    lightning: false,
    lightningContactless: false,
    lightningOperator: "",
    lightningOperatorOther: "",
    other: [],
    inStore: false,
    online: false,
    openingHours: "",
    wheelchair: "",
    notes: "",
    licenseAgreement: true,
    includeOptionalDetails: false,
  } as const;

  it("accepts a minimal valid payload", () => {
    expect(() => formSchema.parse(basePayload)).not.toThrow();
  });

  it("requires at least one acceptance method", () => {
    expect(() =>
      formSchema.parse({
        ...basePayload,
        onChain: false,
      })
    ).toThrowError(/Please select at least one Bitcoin acceptance method/);
  });

  it("enforces lightning operator when lightning is enabled", () => {
    expect(() =>
      formSchema.parse({
        ...basePayload,
        onChain: false,
        lightning: true,
      })
    ).toThrowError(/select your Lightning operator/);

    expect(() =>
      formSchema.parse({
        ...basePayload,
        onChain: false,
        lightning: true,
        lightningOperator: "other",
      })
    ).toThrowError(/name the Lightning operator/);

    expect(() =>
      formSchema.parse({
        ...basePayload,
        onChain: false,
        lightning: true,
        lightningOperator: "square",
      })
    ).not.toThrow();
  });

  it("validates website domains when provided", () => {
    expect(() => formSchema.parse({ ...basePayload, website: "https://example.com" })).not.toThrow();
    expect(() => formSchema.parse({ ...basePayload, website: "invalid" })).toThrowError(/Must be a valid website/);
  });
});
