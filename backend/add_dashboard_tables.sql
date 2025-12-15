-- SQL Script to add missing tables for dashboard functionality
-- Run this on your production database

-- Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE compliancestatus AS ENUM ('not_assessed', 'compliant', 'non_compliant', 'partially_compliant', 'not_applicable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
