import { z } from "zod";

const booleanLikeSchema = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform((value) => {
    if (typeof value === "boolean") {
      return value;
    }
    return (value ?? "").toLowerCase() === "true";
  });

const envSchema = z.object({
  NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: z.string().optional(),
  ALTCHA_SECRET_KEY: z.string().optional(),
  OSM_CLIENT_ID: z.string().optional(),
  OSM_CLIENT_SECRET: z.string().optional(),
  OSM_REFRESH_TOKEN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_KEY: z.string().optional(),
  SUPABASE_DB_PASSWORD: z.string().optional(),
  SUPABASE_REGION: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  MAILJET_API_KEY: z.string().optional(),
  MAILJET_API_SECRET: z.string().optional(),
  MAILJET_FROM_EMAIL: z.string().optional(),
  NEXT_PUBLIC_TYPEFORM_WIZARD_ENABLED: z.string().optional(),
  NOSTR_RELAYS: z.string().optional(),
  NOSTR_PRIVATE_KEY: z.string().optional(),
  NOSTR_PUBLISH_ENABLED: booleanLikeSchema,
  REDIS_URL: z.string().optional(),
  SQLITE_DB_PATH: z.string().optional(),
});

type RawEnv = z.infer<typeof envSchema>;

function ensurePgBouncerParam(url: string): string {
  if (!url) {
    return url;
  }

  if (url.toLowerCase().includes("pgbouncer=")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const looksLikePooler =
      parsed.hostname.includes("pooler.") || parsed.port === "6543";

    if (!looksLikePooler) {
      return url;
    }

    parsed.searchParams.set("pgbouncer", "true");

    if (process.env.NODE_ENV !== "production") {
      console.warn(
        'DATABASE_URL is missing "?pgbouncer=true". Automatically adding it to avoid prepared statement errors with connection pooling.',
      );
    }

    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    const adjustedUrl = `${url}${separator}pgbouncer=true`;

    if (process.env.NODE_ENV !== "production") {
      console.warn(
        'DATABASE_URL is missing "?pgbouncer=true". Automatically adding it to avoid prepared statement errors with connection pooling.',
      );
    }

    return adjustedUrl;
  }
}

function getDatabaseUrl(raw: RawEnv): string {
  const explicitDbUrl = raw.DATABASE_URL;
  if (explicitDbUrl) {
    return ensurePgBouncerParam(explicitDbUrl);
  }

  const supabaseUrl = raw.SUPABASE_URL;
  const supabaseDbPassword = raw.SUPABASE_DB_PASSWORD;
  const supabaseRegion = raw.SUPABASE_REGION || "ap-southeast-2";

  if (supabaseUrl && supabaseDbPassword) {
    const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (urlMatch) {
      const projectRef = urlMatch[1];
      return ensurePgBouncerParam(
        `postgresql://postgres.${projectRef}:${encodeURIComponent(
          supabaseDbPassword,
        )}@aws-0-${supabaseRegion}.pooler.supabase.com:6543/postgres?pgbouncer=true`,
      );
    }
  }

  return "";
}

function parseRelays(rawRelays?: string | null): string[] {
  if (!rawRelays) {
    return [];
  }

  return rawRelays
    .split(",")
    .map((relay) => relay.trim())
    .filter(Boolean);
}

const parsedResult = envSchema.safeParse(process.env);

if (!parsedResult.success) {
  console.error("Invalid environment configuration", parsedResult.error.format());
  throw new Error("Invalid environment configuration. See logs for details.");
}

const rawEnv = parsedResult.data;
const nostrRelays = parseRelays(rawEnv.NOSTR_RELAYS);
const nostrPublishingEnabled =
  Boolean(rawEnv.NOSTR_PUBLISH_ENABLED) && nostrRelays.length > 0;

if (nostrPublishingEnabled) {
  if (!rawEnv.NOSTR_PRIVATE_KEY) {
    throw new Error(
      "NOSTR_PRIVATE_KEY is required when NOSTR_PUBLISH_ENABLED is true.",
    );
  }

  if (!rawEnv.REDIS_URL) {
    throw new Error(
      "REDIS_URL is required for BullMQ and cache when NOSTR_PUBLISH_ENABLED is true.",
    );
  }
}

const parseBoolean = (value?: string | null) =>
  (value ?? "").toLowerCase() === "true";

export const env = {
  googlePlacesApiKey: rawEnv.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? "",
  altchaSecretKey: rawEnv.ALTCHA_SECRET_KEY ?? "",
  osmClientId: rawEnv.OSM_CLIENT_ID ?? "",
  osmClientSecret: rawEnv.OSM_CLIENT_SECRET ?? "",
  osmRefreshToken: rawEnv.OSM_REFRESH_TOKEN ?? "",
  databaseUrl: getDatabaseUrl(rawEnv),
  supabaseUrl: rawEnv.SUPABASE_URL ?? "",
  supabaseKey: rawEnv.SUPABASE_KEY ?? "",
  appUrl: rawEnv.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  mailjetApiKey: rawEnv.MAILJET_API_KEY ?? "",
  mailjetApiSecret: rawEnv.MAILJET_API_SECRET ?? "",
  mailjetFromEmail:
    rawEnv.MAILJET_FROM_EMAIL || "noreply@bitcoinmerchants.com.au",
  typeformWizardEnabled: parseBoolean(
    rawEnv.NEXT_PUBLIC_TYPEFORM_WIZARD_ENABLED ?? "true",
  ),
  nostr: {
    publishEnabled: nostrPublishingEnabled,
    relays: nostrRelays,
    privateKey: rawEnv.NOSTR_PRIVATE_KEY ?? "",
    redisUrl: rawEnv.REDIS_URL ?? "",
    sqliteDbPath: rawEnv.SQLITE_DB_PATH || ".data/ndk-cache.sqlite",
  },
};

