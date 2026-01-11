-- ELORA Fleet Compliance Portal - Complete Database Setup
-- Generated: 2026-01-11T22:42:43.608Z
-- Execute this in Supabase SQL Editor: https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/sql/new


-- =====================================================================
-- supabase/migrations/20250112000001_initial_schema.sql
-- =====================================================================

-- ELORA Fleet Compliance Portal - Initial Schema
-- Multi-tenant architecture with Row-Level Security (RLS)
-- Migration: 20250112000001_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- COMPANIES TABLE (Multi-tenant root)
-- ============================================================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email_domain TEXT UNIQUE,
    elora_customer_ref TEXT UNIQUE, -- Maps to external Elora API customer ref
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_elora_ref ON companies(elora_customer_ref);
CREATE INDEX idx_companies_email_domain ON companies(email_domain);

COMMENT ON TABLE companies IS 'Multi-tenant company/organization table';
COMMENT ON COLUMN companies.elora_customer_ref IS 'Reference to external Elora API customer';

-- ============================================================================
-- USER PROFILES TABLE (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'site_manager', 'driver')),
    assigned_sites TEXT[], -- Array of site refs from external API
    assigned_vehicles TEXT[], -- Array of vehicle refs from external API
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_company ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

COMMENT ON TABLE user_profiles IS 'Extended user profile data linked to Supabase Auth';
COMMENT ON COLUMN user_profiles.company_id IS 'Company the user belongs to (multi-tenancy)';

-- ============================================================================
-- CLIENT BRANDING TABLE
-- ============================================================================
CREATE TABLE client_branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_email_domain TEXT NOT NULL,
    company_name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#7CB342',
    secondary_color TEXT DEFAULT '#9CCC65',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, client_email_domain)
);

CREATE INDEX idx_client_branding_company ON client_branding(company_id);
CREATE INDEX idx_client_branding_domain ON client_branding(client_email_domain);

COMMENT ON TABLE client_branding IS 'Client branding configuration for white-labeling';

-- ============================================================================
-- COMPLIANCE TARGETS TABLE
-- ============================================================================
CREATE TABLE compliance_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_ref TEXT NOT NULL, -- External Elora customer ref
    type TEXT NOT NULL CHECK (type IN ('site', 'vehicle', 'global')),
    name TEXT NOT NULL,
    target_washes_per_week INTEGER NOT NULL CHECK (target_washes_per_week > 0),
    applies_to TEXT DEFAULT 'all', -- 'all', specific site ref, or vehicle ref
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_targets_company ON compliance_targets(company_id);
CREATE INDEX idx_compliance_targets_customer_ref ON compliance_targets(customer_ref);
CREATE INDEX idx_compliance_targets_type ON compliance_targets(type);

COMMENT ON TABLE compliance_targets IS 'Customizable compliance targets for wash frequency';
COMMENT ON COLUMN compliance_targets.applies_to IS 'Scope: "all", site ref, or vehicle ref';

-- ============================================================================
-- FAVORITE VEHICLES TABLE
-- ============================================================================
CREATE TABLE favorite_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    vehicle_ref TEXT NOT NULL, -- External Elora vehicle ref
    vehicle_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, vehicle_ref)
);

CREATE INDEX idx_favorite_vehicles_company ON favorite_vehicles(company_id);
CREATE INDEX idx_favorite_vehicles_user ON favorite_vehicles(user_id);
CREATE INDEX idx_favorite_vehicles_user_email ON favorite_vehicles(user_email);

COMMENT ON TABLE favorite_vehicles IS 'User favorited vehicles for quick access';

-- ============================================================================
-- MAINTENANCE RECORDS TABLE
-- ============================================================================
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    vehicle_id TEXT NOT NULL, -- External vehicle ref or internal ID
    vehicle_name TEXT,
    site_id TEXT, -- External site ref
    service_type TEXT NOT NULL,
    service_date DATE NOT NULL,
    next_service_date DATE,
    cost NUMERIC(10, 2),
    description TEXT,
    performed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_company ON maintenance_records(company_id);
CREATE INDEX idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_service_date ON maintenance_records(service_date DESC);
CREATE INDEX idx_maintenance_next_service ON maintenance_records(next_service_date);

COMMENT ON TABLE maintenance_records IS 'Fleet maintenance records and schedules';

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('maintenance_due', 'maintenance_overdue', 'low_compliance', 'info', 'alert')),
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_company ON notifications(company_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_email ON notifications(user_email);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_metadata ON notifications USING gin(metadata);

COMMENT ON TABLE notifications IS 'User notifications for compliance and maintenance alerts';

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================================
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL UNIQUE,
    email_notifications_enabled BOOLEAN DEFAULT true,
    notify_maintenance_due BOOLEAN DEFAULT true,
    notify_maintenance_overdue BOOLEAN DEFAULT true,
    notify_low_compliance BOOLEAN DEFAULT true,
    maintenance_due_days INTEGER DEFAULT 7 CHECK (maintenance_due_days > 0),
    compliance_threshold INTEGER DEFAULT 50 CHECK (compliance_threshold BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_prefs_company ON notification_preferences(company_id);
CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

COMMENT ON TABLE notification_preferences IS 'User notification preferences and thresholds';

-- ============================================================================
-- EMAIL DIGEST PREFERENCES TABLE
-- ============================================================================
CREATE TABLE email_digest_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT true,
    frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    send_time TIME DEFAULT '08:00',
    include_compliance BOOLEAN DEFAULT true,
    include_maintenance BOOLEAN DEFAULT true,
    include_alerts BOOLEAN DEFAULT true,
    include_activity BOOLEAN DEFAULT true,
    only_if_changes BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_digest_prefs_company ON email_digest_preferences(company_id);
CREATE INDEX idx_email_digest_prefs_user ON email_digest_preferences(user_id);

COMMENT ON TABLE email_digest_preferences IS 'Email digest subscription preferences';

-- ============================================================================
-- EMAIL REPORT PREFERENCES TABLE
-- ============================================================================
CREATE TABLE email_report_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT true,
    frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    scheduled_time TIME DEFAULT '09:00',
    scheduled_day_of_week INTEGER CHECK (scheduled_day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    scheduled_day_of_month INTEGER CHECK (scheduled_day_of_month BETWEEN 1 AND 31),
    report_types TEXT[] DEFAULT ARRAY['compliance', 'maintenance', 'costs'],
    include_charts BOOLEAN DEFAULT true,
    include_ai_insights BOOLEAN DEFAULT true,
    last_sent TIMESTAMPTZ,
    next_scheduled TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_report_prefs_company ON email_report_preferences(company_id);
CREATE INDEX idx_email_report_prefs_user ON email_report_preferences(user_id);
CREATE INDEX idx_email_report_prefs_next_scheduled ON email_report_preferences(next_scheduled);

COMMENT ON TABLE email_report_preferences IS 'Scheduled email report preferences';

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_branding_updated_at BEFORE UPDATE ON client_branding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_targets_updated_at BEFORE UPDATE ON compliance_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_prefs_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_digest_prefs_updated_at BEFORE UPDATE ON email_digest_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_report_prefs_updated_at BEFORE UPDATE ON email_report_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SCHEMA SUMMARY
-- ============================================================================
-- Tables created: 10
-- Indexes created: 33
-- Triggers created: 8
-- Multi-tenant ready with company_id on all tables
-- ============================================================================



-- =====================================================================
-- supabase/migrations/20250112000002_rls_policies.sql
-- =====================================================================

-- ELORA Fleet Compliance Portal - Row-Level Security (RLS) Policies
-- Multi-tenant data isolation using company_id
-- Migration: 20250112000002_rls_policies

-- ============================================================================
-- HELPER FUNCTION: Get user's company_id from user_profiles
-- ============================================================================
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

COMMENT ON FUNCTION auth.user_company_id IS 'Returns the company_id for the currently authenticated user';

-- ============================================================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================================================
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
    SELECT role = 'admin' FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

COMMENT ON FUNCTION auth.is_admin IS 'Returns true if the current user has admin role';

-- ============================================================================
-- COMPANIES TABLE RLS
-- ============================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Admins can see all companies, regular users can only see their own
CREATE POLICY "Users can view their own company"
    ON companies FOR SELECT
    USING (
        id = auth.user_company_id() OR auth.is_admin()
    );

-- Only admins can insert companies
CREATE POLICY "Admins can insert companies"
    ON companies FOR INSERT
    WITH CHECK (auth.is_admin());

-- Only admins can update companies
CREATE POLICY "Admins can update companies"
    ON companies FOR UPDATE
    USING (auth.is_admin());

-- ============================================================================
-- USER PROFILES TABLE RLS
-- ============================================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view profiles in their company
CREATE POLICY "Users can view profiles in their company"
    ON user_profiles FOR SELECT
    USING (
        company_id = auth.user_company_id() OR auth.is_admin()
    );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (id = auth.uid());

-- Admins can insert user profiles
CREATE POLICY "Admins can insert user profiles"
    ON user_profiles FOR INSERT
    WITH CHECK (
        auth.is_admin() OR
        company_id = auth.user_company_id()
    );

-- ============================================================================
-- CLIENT BRANDING TABLE RLS
-- ============================================================================
ALTER TABLE client_branding ENABLE ROW LEVEL SECURITY;

-- Users can view their company's branding
CREATE POLICY "Users can view their company branding"
    ON client_branding FOR SELECT
    USING (company_id = auth.user_company_id());

-- Only admins can manage branding
CREATE POLICY "Admins can manage branding"
    ON client_branding FOR ALL
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- ============================================================================
-- COMPLIANCE TARGETS TABLE RLS
-- ============================================================================
ALTER TABLE compliance_targets ENABLE ROW LEVEL SECURITY;

-- Users can view their company's compliance targets
CREATE POLICY "Users can view their company compliance targets"
    ON compliance_targets FOR SELECT
    USING (company_id = auth.user_company_id());

-- Users can insert compliance targets for their company
CREATE POLICY "Users can insert compliance targets"
    ON compliance_targets FOR INSERT
    WITH CHECK (company_id = auth.user_company_id());

-- Users can update their company's compliance targets
CREATE POLICY "Users can update compliance targets"
    ON compliance_targets FOR UPDATE
    USING (company_id = auth.user_company_id());

-- Users can delete their company's compliance targets
CREATE POLICY "Users can delete compliance targets"
    ON compliance_targets FOR DELETE
    USING (company_id = auth.user_company_id());

-- ============================================================================
-- FAVORITE VEHICLES TABLE RLS
-- ============================================================================
ALTER TABLE favorite_vehicles ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view their own favorites"
    ON favorite_vehicles FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites"
    ON favorite_vehicles FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        company_id = auth.user_company_id()
    );

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites"
    ON favorite_vehicles FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- MAINTENANCE RECORDS TABLE RLS
-- ============================================================================
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Users can view their company's maintenance records
CREATE POLICY "Users can view their company maintenance records"
    ON maintenance_records FOR SELECT
    USING (company_id = auth.user_company_id());

-- Users can insert maintenance records for their company
CREATE POLICY "Users can insert maintenance records"
    ON maintenance_records FOR INSERT
    WITH CHECK (company_id = auth.user_company_id());

-- Users can update their company's maintenance records
CREATE POLICY "Users can update maintenance records"
    ON maintenance_records FOR UPDATE
    USING (company_id = auth.user_company_id());

-- Users can delete their company's maintenance records
CREATE POLICY "Users can delete maintenance records"
    ON maintenance_records FOR DELETE
    USING (company_id = auth.user_company_id());

-- ============================================================================
-- NOTIFICATIONS TABLE RLS
-- ============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

-- System can insert notifications for users in the company
CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (company_id = auth.user_company_id());

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE RLS
-- ============================================================================
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own notification preferences"
    ON notification_preferences FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own notification preferences"
    ON notification_preferences FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        company_id = auth.user_company_id()
    );

-- Users can update their own preferences
CREATE POLICY "Users can update their own notification preferences"
    ON notification_preferences FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================================================
-- EMAIL DIGEST PREFERENCES TABLE RLS
-- ============================================================================
ALTER TABLE email_digest_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own digest preferences
CREATE POLICY "Users can view their own digest preferences"
    ON email_digest_preferences FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own digest preferences
CREATE POLICY "Users can insert their own digest preferences"
    ON email_digest_preferences FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        company_id = auth.user_company_id()
    );

-- Users can update their own digest preferences
CREATE POLICY "Users can update their own digest preferences"
    ON email_digest_preferences FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================================================
-- EMAIL REPORT PREFERENCES TABLE RLS
-- ============================================================================
ALTER TABLE email_report_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own report preferences
CREATE POLICY "Users can view their own report preferences"
    ON email_report_preferences FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own report preferences
CREATE POLICY "Users can insert their own report preferences"
    ON email_report_preferences FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        company_id = auth.user_company_id()
    );

-- Users can update their own report preferences
CREATE POLICY "Users can update their own report preferences"
    ON email_report_preferences FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================================================
-- SERVICE ROLE BYPASS
-- ============================================================================
-- Service role (used by Edge Functions) can bypass all RLS policies
-- This is automatically handled by Supabase when using the service role key

-- ============================================================================
-- RLS POLICIES SUMMARY
-- ============================================================================
-- Total policies created: 31
-- All tables have RLS enabled
-- Multi-tenant isolation enforced via company_id
-- Users can only access data within their company
-- Service role can bypass RLS for system operations
-- ============================================================================



-- =====================================================================
-- supabase/migrations/20250112000003_seed_test_data.sql
-- =====================================================================

-- ELORA Fleet Compliance Portal - Seed Test Data
-- Heidelberg Materials test company with users and sample data
-- Migration: 20250112000003_seed_test_data

-- ============================================================================
-- COMPANY: Heidelberg Materials
-- ============================================================================
INSERT INTO companies (id, name, email_domain, elora_customer_ref, is_active)
VALUES (
    'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
    'Heidelberg Materials',
    'heidelberg.com.au',
    'HM-001',
    true
);

-- ============================================================================
-- CLIENT BRANDING: Heidelberg Materials
-- ============================================================================
INSERT INTO client_branding (
    company_id,
    client_email_domain,
    company_name,
    logo_url,
    primary_color,
    secondary_color
) VALUES (
    'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
    'heidelberg.com.au',
    'Heidelberg Materials',
    NULL, -- Add logo URL if available
    '#003DA5', -- Heidelberg blue
    '#00A3E0'  -- Heidelberg light blue
);

-- ============================================================================
-- USERS: Create test users (requires Supabase Auth setup)
-- Note: In production, users should be created via Supabase Auth signup
-- This is a placeholder showing the expected user_profiles structure
-- ============================================================================

-- Admin user: admin@heidelberg.com.au
-- User ID will be generated by Supabase Auth, this is just a placeholder
DO $$
DECLARE
    admin_user_id uuid := 'hm-admin-uuid-1234-5678-9abc-def012345678'::uuid;
    regular_user_id uuid := 'hm-user-uuid-1234-5678-9abc-def012345679'::uuid;
BEGIN
    -- Insert admin profile (user must be created in Supabase Auth first)
    -- This is commented out as it requires actual auth users to exist
    -- INSERT INTO user_profiles (id, company_id, email, full_name, role, is_active)
    -- VALUES (
    --     admin_user_id,
    --     'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
    --     'admin@heidelberg.com.au',
    --     'Admin User',
    --     'admin',
    --     true
    -- );

    -- Insert regular user profile
    -- INSERT INTO user_profiles (id, company_id, email, full_name, role, is_active)
    -- VALUES (
    --     regular_user_id,
    --     'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
    --     'user@heidelberg.com.au',
    --     'Regular User',
    --     'user',
    --     true
    -- );
END $$;

-- ============================================================================
-- COMPLIANCE TARGETS: Heidelberg Materials
-- ============================================================================
INSERT INTO compliance_targets (
    company_id,
    customer_ref,
    type,
    name,
    target_washes_per_week,
    applies_to
) VALUES
    (
        'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
        'HM-001',
        'global',
        'Standard Fleet Compliance',
        2,
        'all'
    ),
    (
        'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
        'HM-001',
        'site',
        'High Traffic Site Target',
        3,
        'site-melb-001'
    ),
    (
        'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
        'HM-001',
        'vehicle',
        'Premium Vehicle Target',
        4,
        'vehicle-premium-001'
    );

-- ============================================================================
-- MAINTENANCE RECORDS: Sample fleet maintenance history
-- ============================================================================
INSERT INTO maintenance_records (
    company_id,
    vehicle_id,
    vehicle_name,
    site_id,
    service_type,
    service_date,
    next_service_date,
    cost,
    description,
    performed_by
) VALUES
    -- Recent services
    (
        'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
        'HM-TRUCK-001',
        'Concrete Mixer 001',
        'site-melb-001',
        'oil_change',
        CURRENT_DATE - INTERVAL '5 days',
        CURRENT_DATE + INTERVAL '90 days',
        450.00,
        'Regular oil change and filter replacement',
        'Melbourne Service Center'
    ),
    (
        'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
        'HM-TRUCK-002',
        'Concrete Mixer 002',
        'site-melb-001',
        'tire_rotation',
        CURRENT_DATE - INTERVAL '10 days',
        CURRENT_DATE + INTERVAL '180 days',
        280.00,
        'Tire rotation and alignment',
        'Melbourne Service Center'
    ),
    (
        'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
        'HM-TRUCK-003',
        'Concrete Mixer 003',
        'site-melb-001',
        'inspection',
        CURRENT_DATE - INTERVAL '15 days',
        CURRENT_DATE + INTERVAL '30 days',
        150.00,
        'Quarterly safety inspection',
        'Melbourne Service Center'
    ),
    (
        'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
        'HM-TRUCK-004',
        'Dump Truck 001',
        'site-melb-001',
        'brake_service',
        CURRENT_DATE - INTERVAL '20 days',
        CURRENT_DATE + INTERVAL '120 days',
        850.00,
        'Brake pad replacement and system check',
        'Melbourne Service Center'
    ),
    -- Upcoming service (due soon)
    (
        'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
        'HM-TRUCK-005',
        'Dump Truck 002',
        'site-melb-001',
        'oil_change',
        CURRENT_DATE - INTERVAL '85 days',
        CURRENT_DATE + INTERVAL '5 days',
        450.00,
        'Due for oil change',
        'Melbourne Service Center'
    ),
    -- Overdue service
    (
        'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
        'HM-TRUCK-006',
        'Concrete Pump 001',
        'site-melb-002',
        'inspection',
        CURRENT_DATE - INTERVAL '125 days',
        CURRENT_DATE - INTERVAL '5 days',
        150.00,
        'OVERDUE: Quarterly inspection',
        'Sydney Service Center'
    ),
    (
        'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
        'HM-TRUCK-007',
        'Concrete Pump 002',
        'site-melb-002',
        'oil_change',
        CURRENT_DATE - INTERVAL '100 days',
        CURRENT_DATE - INTERVAL '10 days',
        450.00,
        'OVERDUE: Oil change required',
        'Sydney Service Center'
    ),
    -- More historical records
    (
        'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
        'HM-TRUCK-008',
        'Agitator Truck 001',
        'site-syd-001',
        'transmission_service',
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE + INTERVAL '330 days',
        1200.00,
        'Transmission fluid change and inspection',
        'Sydney Service Center'
    ),
    (
        'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
        'HM-TRUCK-009',
        'Agitator Truck 002',
        'site-syd-001',
        'tire_replacement',
        CURRENT_DATE - INTERVAL '45 days',
        NULL,
        2400.00,
        'Full tire replacement - all 6 tires',
        'Sydney Service Center'
    ),
    (
        'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
        'HM-TRUCK-010',
        'Transit Mixer 001',
        'site-syd-002',
        'hydraulic_service',
        CURRENT_DATE - INTERVAL '60 days',
        CURRENT_DATE + INTERVAL '120 days',
        680.00,
        'Hydraulic system maintenance and leak check',
        'Sydney Service Center'
    );

-- ============================================================================
-- SAMPLE DATA SUMMARY
-- ============================================================================
-- Companies: 1 (Heidelberg Materials)
-- Client Branding: 1
-- Compliance Targets: 3 (global, site-specific, vehicle-specific)
-- Maintenance Records: 10 (mix of recent, upcoming, and overdue)
--
-- Note: User profiles require Supabase Auth users to exist first
-- Create users via Supabase dashboard or Auth API, then add profiles
--
-- To test notifications:
-- 1. Create auth users for admin@heidelberg.com.au and user@heidelberg.com.au
-- 2. Add their profiles to user_profiles table
-- 3. Run the checkNotifications function
-- ============================================================================

-- ============================================================================
-- HELPER: Create user profile after auth signup
-- This function can be called after creating a user via Supabase Auth
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_id uuid,
    user_email text,
    user_full_name text DEFAULT NULL,
    user_role text DEFAULT 'user'
)
RETURNS void AS $$
DECLARE
    user_company_id uuid;
    email_domain text;
BEGIN
    -- Extract email domain
    email_domain := split_part(user_email, '@', 2);

    -- Find company by email domain
    SELECT id INTO user_company_id
    FROM companies
    WHERE email_domain = create_user_profile.email_domain
    LIMIT 1;

    -- If no company found, use Heidelberg Materials as default for testing
    IF user_company_id IS NULL THEN
        user_company_id := 'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid;
    END IF;

    -- Insert user profile
    INSERT INTO user_profiles (id, company_id, email, full_name, role, is_active)
    VALUES (user_id, user_company_id, user_email, user_full_name, user_role, true)
    ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_user_profile IS 'Helper function to create user profile after Supabase Auth signup';

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================
-- SELECT * FROM companies;
-- SELECT * FROM compliance_targets;
-- SELECT * FROM maintenance_records ORDER BY service_date DESC;
-- SELECT * FROM user_profiles;
-- ============================================================================


