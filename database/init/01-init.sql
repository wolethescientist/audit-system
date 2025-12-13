-- Production Database Initialization Script
-- This script sets up the production database with all required extensions and configurations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create audit schema for ISO 27001 compliance
CREATE SCHEMA IF NOT EXISTS audit_logs;

-- Set up database configuration for performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- Create indexes for performance optimization
-- These will be created by Alembic migrations, but listed here for reference

-- Performance monitoring function
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE (
    stat_name TEXT,
    stat_value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'active_connections'::TEXT, COUNT(*)::NUMERIC FROM pg_stat_activity WHERE state = 'active'
    UNION ALL
    SELECT 'total_connections'::TEXT, COUNT(*)::NUMERIC FROM pg_stat_activity
    UNION ALL
    SELECT 'database_size_mb'::TEXT, pg_database_size(current_database())::NUMERIC / 1024 / 1024
    UNION ALL
    SELECT 'cache_hit_ratio'::TEXT, 
           CASE WHEN (blks_hit + blks_read) > 0 
                THEN (blks_hit::NUMERIC / (blks_hit + blks_read)) * 100 
                ELSE 0 
           END
    FROM pg_stat_database WHERE datname = current_database();
END;
$$ LANGUAGE plpgsql;

-- Create backup user with limited privileges
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'backup_user') THEN
        CREATE ROLE backup_user WITH LOGIN PASSWORD 'backup_secure_password';
        GRANT CONNECT ON DATABASE audit_db TO backup_user;
        GRANT USAGE ON SCHEMA public TO backup_user;
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO backup_user;
    END IF;
END
$$;

-- ISO 27001 Audit Trail Configuration
CREATE OR REPLACE FUNCTION audit_logs.log_data_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs.system_audit_logs (
            user_id, action_type, table_name, record_id, 
            before_values, after_values, ip_address, timestamp
        ) VALUES (
            COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'),
            TG_OP,
            TG_TABLE_NAME,
            OLD.id,
            row_to_json(OLD),
            NULL,
            current_setting('app.client_ip', true),
            NOW()
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs.system_audit_logs (
            user_id, action_type, table_name, record_id, 
            before_values, after_values, ip_address, timestamp
        ) VALUES (
            COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'),
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW),
            current_setting('app.client_ip', true),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs.system_audit_logs (
            user_id, action_type, table_name, record_id, 
            before_values, after_values, ip_address, timestamp
        ) VALUES (
            COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'),
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            NULL,
            row_to_json(NEW),
            current_setting('app.client_ip', true),
            NOW()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Performance optimization settings
COMMENT ON DATABASE audit_db IS 'ISO Compliant Audit Management System - Production Database';