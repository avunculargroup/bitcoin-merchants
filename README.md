# BTCMap Onboarding Portal

A self-service onboarding portal that allows Australian businesses to register themselves as accepting Bitcoin and have that information published on BTC Map (which uses OpenStreetMap data).

## Features

- Business search using Google Places Autocomplete
- Geocoding via Nominatim (OSM-licensed)
- Automatic duplicate detection
- OSM v0.6 API integration for creating/updating nodes
- Admin dashboard for moderation
- Privacy-first ALTCHA integration
- Responsive design with Tailwind CSS and ShadUI

## Tech Stack

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** ShadUI (Radix UI)
- **Database:** Supabase (PostgreSQL) with Prisma ORM
- **Authentication:** NextAuth.js
- **Maps:** Google Places API, Nominatim, Overpass API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Places API key
- OSM API credentials (OAuth 2.0)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd au-bts-onboarding
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `.env.local`:

Create a `.env.local` file in the root directory with the following variables:

```bash
# Google Places API
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# ALTCHA Configuration
ALTCHA_SECRET_KEY=your_altcha_secret_key_here

# OSM API Credentials
# Note: You need a REFRESH TOKEN, not an access token.
# Access tokens expire quickly; refresh tokens are long-lived.
# See OSM_SETUP.md for detailed instructions.
OSM_CLIENT_ID=your_osm_client_id_here
OSM_CLIENT_SECRET=your_osm_client_secret_here
OSM_REFRESH_TOKEN=your_osm_refresh_token_here

# Supabase Database Configuration
# Get this from Supabase Dashboard > Settings > Database > Connection string (URI)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true

# Alternative: Use Supabase variables (auto-constructs DATABASE_URL)
# SUPABASE_URL=https://your-project-ref.supabase.co
# SUPABASE_KEY=your_supabase_anon_key_here
# SUPABASE_DB_PASSWORD=your_database_password_here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

**Required variables:**
- `DATABASE_URL` - Supabase PostgreSQL connection string (get from Supabase Dashboard > Settings > Database)
- `NEXTAUTH_SECRET` - Secret for NextAuth session encryption (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your application URL

**Optional but recommended:**
- `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` - For business search (required for search functionality)
- `ALTCHA_SECRET_KEY` - For captcha verification (required for submissions)
- `OSM_CLIENT_ID`, `OSM_CLIENT_SECRET`, `OSM_REFRESH_TOKEN` - For OSM API integration (required for OSM uploads)
- `NEXT_PUBLIC_APP_URL` - Application URL (defaults to http://localhost:3000 if not set)

4. Set up the Supabase database:
   - Follow the instructions in `SUPABASE_SETUP.md`
   - Run the SQL script in `supabase-setup.sql` in your Supabase SQL Editor
   - Generate the Prisma client:
   ```bash
   npx prisma generate
   ```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── submit/            # Submission form
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/                # ShadUI components
│   └── ...                # Feature components
├── lib/                   # Utility functions
│   ├── prisma.ts          # Prisma client
│   ├── osm.ts             # OSM API integration
│   └── env.ts             # Environment variables
├── prisma/                # Prisma schema
└── types/                 # TypeScript types
```

## Environment Variables

See `.env.example` for all required environment variables.

## Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:
- `submissions` - Business submissions
- `osm_nodes` - Links to OSM nodes
- `admin_users` - Admin authentication
- `email_verifications` - Email verification tokens
- `testimonials` - Testimonials for landing page
- `newsletter_subscriptions` - Newsletter sign-ups

See `SUPABASE_SETUP.md` for database setup instructions.

## OSM Integration

The portal uses a dedicated OSM import account to create/update nodes. Each business is uploaded as an individual changeset with proper tags and metadata.

## License

This project is part of the BTCMap ecosystem. Business data is published to OpenStreetMap under the ODbL license.

## Support

For questions or issues, contact: info@bitcoinmerchants.com.au

