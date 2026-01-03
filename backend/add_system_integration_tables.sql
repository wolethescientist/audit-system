-- System Integration Tables Migration Script
-- Creates system_audit_logs and performance_monitoring_config tables
-- For ISO 27001 A.12.4 compliance

-- =====================================================
-- 1. Create system_audit_logs table
-- =====================================================
CREATE TABLE IF NOT EXISTS system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR,
    ip_address VARCHAR,
    user_agent VARCHAR,
    action_type VARCHAR NOT NULL,
    resource_type VARCHAR NOT NULL,
    resource_id VARCHAR,
    table_name VARCHAR,
    before_values JSONB,
    after_values JSONB,
    changed_fields JSONB,
    endpoint VARCHAR,
    http_method VARCHAR,
    request_data JSONB,
    response_status INTEGER,
    audit_id UUID REFERENCES audits(id),
    business_context VARCHAR,
    risk_level VARCHAR DEFAULT 'low' NOT NULL,
    security_event BOOLEAN DEFAULT FALSE NOT NULL,
    retention_period_years INTEGER DEFAULT 7 NOT NULL,
    is_immutable BOOLEAN DEFAULT TRUE NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 2. Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_user_id ON system_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_timestamp ON system_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_action_type ON system_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_resource_type ON system_audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_risk_level ON system_audit_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_security_event ON system_audit_logs(security_event);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_audit_id ON system_audit_logs(audit_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_user_timestamp ON system_audit_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_resource_timestamp ON system_audit_logs(resource_type, timestamp);

-- =====================================================
-- 3. Create performance_monitoring_config table
-- =====================================================
CREATE TABLE IF NOT EXISTS performance_monitoring_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR NOT NULL UNIQUE,
    threshold_warning NUMERIC(20, 2),
    threshold_critical NUMERIC(20, 2),
    unit VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    enabled BOOLEAN DEFAULT TRUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 4. Insert default performance monitoring thresholds
-- =====================================================
INSERT INTO performance_monitoring_config (metric_name, threshold_warning, threshold_critical, unit, category, description) 
VALUES
    ('cpu_percent', 70.0, 90.0, 'percent', 'system', 'CPU utilization percentage'),
    ('memory_percent', 80.0, 95.0, 'percent', 'system', 'Memory utilization percentage'),
    ('disk_percent', 85.0, 95.0, 'percent', 'system', 'Disk utilization percentage'),
    ('response_time_ms', 2000.0, 5000.0, 'milliseconds', 'performance', 'API response time'),
    ('db_query_time_ms', 1000.0, 3000.0, 'milliseconds', 'database', 'Database query execution time'),
    ('db_connection_usage_percent', 80.0, 95.0, 'percent', 'database', 'Database connection pool usage'),
    ('db_active_connections', 50.0, 80.0, 'count', 'database', 'Active database connections'),
    ('network_bytes_sent', 1000000000.0, 5000000000.0, 'bytes', 'network', 'Network bytes sent per hour'),
    ('network_bytes_recv', 1000000000.0, 5000000000.0, 'bytes', 'network', 'Network bytes received per hour')
ON CONFLICT (metric_name) DO NOTHING;

-- =====================================================
-- 5. Create security events view (ISO 27001 A.12.4.1)
-- =====================================================
CREATE OR REPLACE VIEW v_security_events AS
SELECT 
    id,
    user_id,
    action_type,
    resource_type,
    resource_id,
    ip_address,
    endpoint,
    http_method,
    risk_level,
    business_context,
    timestamp,
    request_data
FROM system_audit_logs
WHERE security_event = TRUE
ORDER BY timestamp DESC;

-- =====================================================
-- 6. Create high-risk activities view
-- =====================================================
CREATE OR REPLACE VIEW v_high_risk_activities AS
SELECT 
    id,
    user_id,
    action_type,
    resource_type,
    resource_id,
    ip_address,
    risk_level,
    business_context,
    timestamp,
    changed_fields
FROM system_audit_logs
WHERE risk_level IN ('high', 'critical')
ORDER BY timestamp DESC;

-- =====================================================
-- Verification
-- =====================================================
SELECT 'system_audit_logs table created' AS status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_audit_logs');
SELECT 'performance_monitoring_config table created' AS status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_monitoring_config');
SELECT COUNT(*) AS performance_config_count FROM performance_monitoring_config;
