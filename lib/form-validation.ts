import { z } from "zod";
import { websiteDomainPattern } from "@/lib/form-helpers";

const emptyStringOptional = () => z.union([z.string().min(1), z.literal(""), z.undefined()]);

export const formSchema = z
  .object({
    businessName: z.string().min(1, "Business name is required"),
    description: emptyStringOptional(),
    category: z.string().min(1, "Category is required"),
    street: emptyStringOptional(),
    housenumber: emptyStringOptional(),
    suburb: emptyStringOptional(),
    postcode: emptyStringOptional(),
    state: emptyStringOptional(),
    city: emptyStringOptional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    phone: emptyStringOptional(),
    website: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (value) => {
          if (!value) return true;
          return websiteDomainPattern.test(value);
        },
        { message: "Must be a valid website (domain + TLD)" }
      ),
    email: z
      .string()
      .email("Must be a valid email")
      .optional()
      .or(z.literal("")),
    facebook: emptyStringOptional(),
    instagram: emptyStringOptional(),
    onChain: z.boolean(),
    lightning: z.boolean(),
    lightningContactless: z.boolean(),
    lightningOperator: emptyStringOptional(),
    lightningOperatorOther: emptyStringOptional(),
    other: z.array(z.string()).default([]),
    inStore: z.boolean(),
    online: z.boolean(),
    openingHours: emptyStringOptional(),
    wheelchair: emptyStringOptional(),
    notes: emptyStringOptional(),
    licenseAgreement: z.boolean().refine((val) => val === true, {
      message: "You must agree to the license terms",
    }),
    includeOptionalDetails: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    const hasAcceptance =
      data.onChain ||
      data.lightning ||
      data.lightningContactless ||
      data.inStore ||
      data.online ||
      (data.other && data.other.length > 0);

    if (!hasAcceptance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["onChain"],
        message: "Please select at least one Bitcoin acceptance method",
      });
    }

    if (data.lightning) {
      if (!data.lightningOperator || data.lightningOperator.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lightningOperator"],
          message: "Please select your Lightning operator",
        });
      } else if (
        data.lightningOperator === "other" &&
        (!data.lightningOperatorOther || data.lightningOperatorOther.trim() === "")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lightningOperatorOther"],
          message: "Please name the Lightning operator",
        });
      }
    }
  });

export type FormValues = z.infer<typeof formSchema>;

export const defaultValues: FormValues = {
  businessName: "",
  description: "",
  category: "",
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
  onChain: false,
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
  licenseAgreement: false,
  includeOptionalDetails: false,
};

