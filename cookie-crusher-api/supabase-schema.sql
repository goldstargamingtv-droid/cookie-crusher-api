-- Cookie Crusher - Supabase Schema
-- Run this in the Supabase SQL Editor

-- Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  license_key TEXT NOT NULL UNIQUE,
  product TEXT NOT NULL DEFAULT 'cookie-crusher-pro',
  stripe_session_id TEXT,
  stripe_customer_id TEXT,
  amount_paid INTEGER,
  currency TEXT DEFAULT 'usd',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT unique_email_product UNIQUE (email, product)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email);
CREATE INDEX IF NOT EXISTS idx_licenses_product ON licenses(product);
CREATE INDEX IF NOT EXISTS idx_licenses_email_product ON licenses(email, product);

-- Enable Row Level Security
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access (API uses service key)
CREATE POLICY "Service role access only" ON licenses
  FOR ALL
  USING (auth.role() = 'service_role');

-- Optional: View for quick stats
CREATE OR REPLACE VIEW license_stats AS
SELECT 
  product,
  COUNT(*) as total_licenses,
  COUNT(*) FILTER (WHERE active = true) as active_licenses,
  SUM(amount_paid) / 100.0 as total_revenue,
  MIN(created_at) as first_sale,
  MAX(created_at) as last_sale
FROM licenses
GROUP BY product;

-- ============================================
-- Popup Reports table (for missed popups)
-- ============================================
CREATE TABLE IF NOT EXISTS popup_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hostname TEXT NOT NULL,
  url TEXT,
  user_agent TEXT,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- pending, reviewed, fixed, ignored
  notes TEXT,
  fixed_in_version TEXT,
  report_count INTEGER DEFAULT 1
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_popup_reports_hostname ON popup_reports(hostname);
CREATE INDEX IF NOT EXISTS idx_popup_reports_status ON popup_reports(status);

-- Enable RLS
ALTER TABLE popup_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access
CREATE POLICY "Service role reports access" ON popup_reports
  FOR ALL
  USING (auth.role() = 'service_role');

-- View for report stats
CREATE OR REPLACE VIEW report_stats AS
SELECT 
  hostname,
  COUNT(*) as report_count,
  MIN(reported_at) as first_reported,
  MAX(reported_at) as last_reported,
  status
FROM popup_reports
GROUP BY hostname, status
ORDER BY report_count DESC;
