// Environment variable validation

export function getEnvVar(name: string, required = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || '';
}

function ensurePgBouncerParam(url: string): string {
  if (!url) {
    return url;
  }

  if (url.toLowerCase().includes('pgbouncer=')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const looksLikePooler =
      parsed.hostname.includes('pooler.') || parsed.port === '6543';

    if (!looksLikePooler) {
      return url;
    }

    parsed.searchParams.set('pgbouncer', 'true');

    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'DATABASE_URL is missing "?pgbouncer=true". Automatically adding it to avoid prepared statement errors with connection pooling.',
      );
    }

    return parsed.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    const adjustedUrl = `${url}${separator}pgbouncer=true`;

    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'DATABASE_URL is missing "?pgbouncer=true". Automatically adding it to avoid prepared statement errors with connection pooling.',
      );
    }

    return adjustedUrl;
  }
}

// Construct DATABASE_URL from Supabase variables if provided
function getDatabaseUrl(): string {
  // If DATABASE_URL is explicitly provided, use it (recommended)
  const explicitDbUrl = process.env.DATABASE_URL;
  if (explicitDbUrl) {
    return ensurePgBouncerParam(explicitDbUrl);
  }

  // Otherwise, try to construct from Supabase variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseDbPassword = process.env.SUPABASE_DB_PASSWORD;
  const supabaseRegion = process.env.SUPABASE_REGION || 'ap-southeast-2'; // Default to Sydney

  if (supabaseUrl && supabaseDbPassword) {
    // Extract project reference from Supabase URL
    // URL format: https://[PROJECT_REF].supabase.co
    const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (urlMatch) {
      const projectRef = urlMatch[1];
      // Use connection pooling for better performance
      // Note: You may need to adjust the region based on your Supabase project location
      return ensurePgBouncerParam(
        `postgresql://postgres.${projectRef}:${encodeURIComponent(
          supabaseDbPassword,
        )}@aws-0-${supabaseRegion}.pooler.supabase.com:6543/postgres?pgbouncer=true`,
      );
    }
  }

  // Fallback to empty string if not configured
  return '';
}

const parseBoolean = (value?: string | null) => (value ?? "").toLowerCase() === "true";

export const env = {
  googlePlacesApiKey: getEnvVar('NEXT_PUBLIC_GOOGLE_PLACES_API_KEY', false),
  altchaSecretKey: getEnvVar('ALTCHA_SECRET_KEY', false),
  osmClientId: getEnvVar('OSM_CLIENT_ID', false),
  osmClientSecret: getEnvVar('OSM_CLIENT_SECRET', false),
  osmRefreshToken: getEnvVar('OSM_REFRESH_TOKEN', false),
  databaseUrl: getDatabaseUrl(),
  supabaseUrl: getEnvVar('SUPABASE_URL', false),
  supabaseKey: getEnvVar('SUPABASE_KEY', false),
  appUrl: getEnvVar('NEXT_PUBLIC_APP_URL', false) || 'http://localhost:3000',
  mailjetApiKey: getEnvVar('MAILJET_API_KEY', false),
  mailjetApiSecret: getEnvVar('MAILJET_API_SECRET', false),
  mailjetFromEmail: getEnvVar('MAILJET_FROM_EMAIL', false) || 'noreply@bitcoinmerchants.com.au',
  typeformWizardEnabled: parseBoolean(process.env.NEXT_PUBLIC_TYPEFORM_WIZARD_ENABLED),
};

