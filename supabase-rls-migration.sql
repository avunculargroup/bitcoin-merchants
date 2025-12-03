-- Migration script to enable RLS on existing production database
-- Run this in your Supabase SQL Editor on the live database
-- This is safe to run - it won't affect your application since it uses direct database connections via Prisma

-- Enable Row Level Security on all tables
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

