-- Supabase Database Setup Script
-- Run this in your Supabase SQL Editor to create all required tables
-- WARNING: This script will DROP all existing tables and recreate them

-- Drop existing tables (in order to respect foreign key constraints)
-- CASCADE will automatically drop dependent objects like triggers, indexes, and constraints
DROP TABLE IF EXISTS osm_nodes CASCADE;
DROP TABLE IF EXISTS email_verifications CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;
DROP TABLE IF EXISTS geocoding_cache CASCADE;
DROP TABLE IF EXISTS geocoding_rate_limit CASCADE;

-- Drop function if it exists (triggers are automatically dropped with CASCADE above)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status VARCHAR(50) DEFAULT 'pending',
    business_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    street VARCHAR(255),
    suburb VARCHAR(100),
    postcode VARCHAR(20),
    state VARCHAR(50),
    city VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone VARCHAR(50),
    website VARCHAR(255),
    email VARCHAR(255),
    bitcoin_details JSONB,
    opening_hours TEXT,
    wheelchair VARCHAR(50),
    notes TEXT,
    user_email VARCHAR(255),
    duplicate_osm_id BIGINT,
    duplicate_osm_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create osm_nodes table
CREATE TABLE IF NOT EXISTS osm_nodes (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT NOT NULL,
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    version INTEGER,
    changeset_id BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    submission_id UUID REFERENCES submissions(id),
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    quote TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    business_name VARCHAR(255),
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create newsletter_subscriptions table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create geocoding_cache table for caching Nominatim geocoding results
CREATE TABLE IF NOT EXISTS geocoding_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    normalized_address VARCHAR(500) UNIQUE NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create geocoding_rate_limit table for global rate limiting
CREATE TABLE IF NOT EXISTS geocoding_rate_limit (
    id SERIAL PRIMARY KEY,
    last_request_time TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_osm_nodes_submission_id ON osm_nodes(submission_id);
CREATE INDEX IF NOT EXISTS idx_osm_nodes_osm_id ON osm_nodes(osm_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_normalized_address ON geocoding_cache(normalized_address);
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_expires_at ON geocoding_cache(expires_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_subscriptions_updated_at BEFORE UPDATE ON newsletter_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE submissions IS 'Business submissions for Bitcoin-accepting merchants';
COMMENT ON TABLE osm_nodes IS 'OpenStreetMap node references for uploaded submissions';
COMMENT ON TABLE admin_users IS 'Admin user accounts for managing submissions';
COMMENT ON TABLE email_verifications IS 'Email verification tokens for submissions';
COMMENT ON TABLE testimonials IS 'User testimonials for the platform';
COMMENT ON TABLE newsletter_subscriptions IS 'Newsletter subscription list';
COMMENT ON TABLE geocoding_cache IS 'Cached geocoding results from Nominatim to comply with usage policy';
COMMENT ON TABLE geocoding_rate_limit IS 'Global rate limit tracking for Nominatim API requests (1 req/sec)';

-- Enable Row Level Security on all tables
-- This prevents public access via PostgREST while allowing direct database connections via Prisma
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE osm_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE geocoding_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE geocoding_rate_limit ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Deny all public access" ON submissions;
DROP POLICY IF EXISTS "Deny all public access" ON osm_nodes;
DROP POLICY IF EXISTS "Deny all public access" ON admin_users;
DROP POLICY IF EXISTS "Deny all public access" ON email_verifications;
DROP POLICY IF EXISTS "Deny all public access" ON geocoding_cache;
DROP POLICY IF EXISTS "Deny all public access" ON geocoding_rate_limit;
DROP POLICY IF EXISTS "Deny all public access" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Deny all public access" ON testimonials;

-- Create policies that deny all public access via PostgREST
-- Since the app uses direct database connections via Prisma, 
-- these policies will block PostgREST access but won't affect the application

-- Submissions: No public access via PostgREST
CREATE POLICY "Deny all public access" ON submissions
  FOR ALL
  USING (false);

-- OSM Nodes: No public access via PostgREST
CREATE POLICY "Deny all public access" ON osm_nodes
  FOR ALL
  USING (false);

-- Admin Users: No public access via PostgREST
CREATE POLICY "Deny all public access" ON admin_users
  FOR ALL
  USING (false);

-- Email Verifications: No public access via PostgREST
CREATE POLICY "Deny all public access" ON email_verifications
  FOR ALL
  USING (false);

-- Geocoding Cache: No public access via PostgREST
CREATE POLICY "Deny all public access" ON geocoding_cache
  FOR ALL
  USING (false);

-- Geocoding Rate Limit: No public access via PostgREST
CREATE POLICY "Deny all public access" ON geocoding_rate_limit
  FOR ALL
  USING (false);

-- Newsletter Subscriptions: No public access via PostgREST
CREATE POLICY "Deny all public access" ON newsletter_subscriptions
  FOR ALL
  USING (false);

-- Testimonials: No public access via PostgREST
CREATE POLICY "Deny all public access" ON testimonials
  FOR ALL
  USING (false);

