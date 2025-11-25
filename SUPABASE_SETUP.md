# Supabase Setup Instructions

This guide will help you set up your Supabase database for the Aussie Bitcoin Merchants portal.

## Prerequisites

- A Supabase account and project
- Your Supabase project URL and API key (already in your `.env.local`)

## Step 1: Get Your Database Password

1. Go to your Supabase Dashboard
2. Navigate to **Settings** > **Database**
3. Find your database password (or reset it if needed)
4. Copy the password

## Step 2: Add Database Password to Environment

Add the database password to your `.env.local` file:

```bash
SUPABASE_DB_PASSWORD=your_database_password_here
```

## Step 3: Get Direct Connection String (Alternative Method)

If you prefer to use a direct connection string instead of the automatic construction:

1. Go to **Settings** > **Database** in your Supabase Dashboard
2. Scroll down to **Connection string**
3. Select **URI** format
4. Copy the connection string (it will look like):
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
5. Add it to your `.env.local` as `DATABASE_URL`

**Note:** If you use `DATABASE_URL` directly, you don't need `SUPABASE_DB_PASSWORD`.

## Step 4: Create Database Tables

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New query**
4. Copy and paste the contents of `supabase-setup.sql`
5. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

This will create all required tables:
- `submissions` - Business submissions
- `osm_nodes` - OpenStreetMap node references
- `admin_users` - Admin accounts
- `email_verifications` - Email verification tokens
- `testimonials` - User testimonials
- `newsletter_subscriptions` - Newsletter subscriptions

## Step 5: Verify Setup

After running the SQL script, verify the tables were created:

1. Go to **Table Editor** in your Supabase Dashboard
2. You should see all 6 tables listed

## Step 6: Generate Prisma Client

Run the following command to generate the Prisma client:

```bash
npx prisma generate
```

## Step 7: Test the Connection

Start your development server:

```bash
npm run dev
```

The application should now connect to your Supabase database.

## Troubleshooting

### Connection Issues

If you're having connection issues:

1. **Check your region**: The connection string in `lib/env.ts` uses `ap-southeast-2` (Sydney). If your Supabase project is in a different region, update the connection string accordingly.

2. **Use direct connection**: Try using the direct `DATABASE_URL` from Supabase Dashboard instead of the auto-constructed one.

3. **Check firewall**: Ensure your IP is allowed in Supabase Dashboard > Settings > Database > Connection Pooling.

### Region Configuration

To find your Supabase region:
1. Go to **Settings** > **General** in Supabase Dashboard
2. Check the **Region** field
3. Update the region in `lib/env.ts` if needed (currently set to `ap-southeast-2`)

Common regions:
- `ap-southeast-2` - Sydney, Australia
- `us-east-1` - North Virginia, USA
- `eu-west-1` - Ireland
- `ap-northeast-1` - Tokyo, Japan

## Next Steps

After setup, you may want to:

1. Create an admin user (you'll need to do this manually or through a script)
2. Test submitting a business through the portal
3. Verify data appears in your Supabase tables

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your database password secure
- Use connection pooling for production (already configured)
- Consider enabling Row Level Security (RLS) in Supabase if needed

