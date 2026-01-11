# ELORA Fleet Compliance Portal - Database Schema Design

## Overview

This document describes the PostgreSQL database schema for the ELORA Fleet Compliance Portal, migrated from Base44 to Supabase.

**Migration Date:** January 12, 2025
**Database:** PostgreSQL 15+ (Supabase)
**Architecture:** Multi-tenant with Row-Level Security (RLS)

---

## Architecture Principles

### 1. Multi-Tenancy
- All user-facing tables include `company_id` for tenant isolation
- Row-Level Security (RLS) enforces data access boundaries
- Service role bypasses RLS for system operations

### 2. Data Separation
- **Application Data** (stored in Supabase): User settings, preferences, custom targets, notifications
- **External API Data** (from Elora API): Vehicles, scans/washes, sites, devices, refills (read-only, not stored)

### 3. Authentication
- Uses Supabase Auth (`auth.users`) for user authentication
- `user_profiles` table extends auth users with company association and roles

---

## Entity-Relationship Diagram

```
┌─────────────────┐
│   companies     │──┐
│  (multi-tenant) │  │
└─────────────────┘  │
         │           │
         │ 1:N       │
         ▼           │
┌─────────────────┐  │
│ user_profiles   │◄─┤
│ (extends auth)  │  │
└─────────────────┘  │
    │                │
    │ 1:N            │
    ▼                │
┌──────────────────┐ │
│ favorite_        │ │
│   vehicles       │ │
└──────────────────┘ │
                     │
┌──────────────────┐ │
│ notifications    │◄┤
└──────────────────┘ │
                     │
┌──────────────────┐ │
│ notification_    │ │
│  preferences     │◄┤
└──────────────────┘ │
                     │
┌──────────────────┐ │
│ email_digest_    │ │
│  preferences     │◄┤
└──────────────────┘ │
                     │
┌──────────────────┐ │
│ email_report_    │ │
│  preferences     │◄┤
└──────────────────┘ │
                     │
┌──────────────────┐ │
│ compliance_      │ │
│   targets        │◄┤
└──────────────────┘ │
                     │
┌──────────────────┐ │
│ maintenance_     │ │
│   records        │◄┤
└──────────────────┘ │
                     │
┌──────────────────┐ │
│ client_branding  │◄┘
└──────────────────┘
```

---

## Table Descriptions

### Core Tables

#### `companies`
**Purpose:** Multi-tenant root table for organizations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Company name |
| email_domain | TEXT | Email domain for auto-assignment (e.g., "heidelberg.com.au") |
| elora_customer_ref | TEXT | Maps to external Elora API customer reference |
| is_active | BOOLEAN | Company active status |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `idx_companies_elora_ref` on `elora_customer_ref`
- `idx_companies_email_domain` on `email_domain`

---

#### `user_profiles`
**Purpose:** Extended user profile data linked to Supabase Auth

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | FK to auth.users (Primary key) |
| company_id | UUID | FK to companies (multi-tenancy) |
| email | TEXT | User email (unique) |
| full_name | TEXT | User's full name |
| role | TEXT | User role: admin, user, site_manager, driver |
| assigned_sites | TEXT[] | Array of site refs from external API |
| assigned_vehicles | TEXT[] | Array of vehicle refs from external API |
| is_active | BOOLEAN | User active status |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `idx_user_profiles_company` on `company_id`
- `idx_user_profiles_email` on `email`
- `idx_user_profiles_role` on `role`

---

### Feature Tables

#### `compliance_targets`
**Purpose:** Custom compliance wash frequency targets

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| customer_ref | TEXT | External Elora customer ref |
| type | TEXT | Target scope: site, vehicle, global |
| name | TEXT | Target name |
| target_washes_per_week | INTEGER | Required washes per week |
| applies_to | TEXT | Scope identifier: "all", site ref, or vehicle ref |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Base44 Mapping:**
- `Base44.ComplianceTarget` → `compliance_targets`

---

#### `favorite_vehicles`
**Purpose:** User-favorited vehicles for quick access

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| user_id | UUID | FK to auth.users |
| user_email | TEXT | User email (denormalized for queries) |
| vehicle_ref | TEXT | External Elora vehicle reference |
| vehicle_name | TEXT | Vehicle name (cached) |
| created_at | TIMESTAMPTZ | Record creation timestamp |

**Base44 Mapping:**
- `Base44.FavoriteVehicle` → `favorite_vehicles`

**Unique Constraint:** (user_id, vehicle_ref)

---

#### `maintenance_records`
**Purpose:** Fleet maintenance history and scheduling

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| vehicle_id | TEXT | External vehicle ref or internal ID |
| vehicle_name | TEXT | Vehicle name |
| site_id | TEXT | External site ref |
| service_type | TEXT | Type of service performed |
| service_date | DATE | Service completion date |
| next_service_date | DATE | Next scheduled service date |
| cost | NUMERIC(10,2) | Service cost |
| description | TEXT | Service description |
| performed_by | TEXT | Service provider/technician |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Base44 Mapping:**
- `Base44.Maintenance` → `maintenance_records`

**Indexes:**
- `idx_maintenance_service_date` on `service_date DESC`
- `idx_maintenance_next_service` on `next_service_date`

---

#### `notifications`
**Purpose:** User notifications for compliance and maintenance alerts

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| user_id | UUID | FK to auth.users |
| user_email | TEXT | User email |
| title | TEXT | Notification title |
| message | TEXT | Notification message |
| type | TEXT | Type: maintenance_due, maintenance_overdue, low_compliance, info, alert |
| severity | TEXT | Severity: info, warning, critical |
| is_read | BOOLEAN | Read status |
| metadata | JSONB | Additional metadata (vehicle_id, etc.) |
| created_at | TIMESTAMPTZ | Record creation timestamp |

**Base44 Mapping:**
- `Base44.Notification` → `notifications`

**Indexes:**
- `idx_notifications_is_read` on `is_read`
- `idx_notifications_created_at` on `created_at DESC`
- `idx_notifications_metadata` (GIN index for JSONB)

---

#### `notification_preferences`
**Purpose:** User notification settings and thresholds

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| user_id | UUID | FK to auth.users |
| user_email | TEXT | User email (unique) |
| email_notifications_enabled | BOOLEAN | Email notifications on/off |
| notify_maintenance_due | BOOLEAN | Alert for upcoming maintenance |
| notify_maintenance_overdue | BOOLEAN | Alert for overdue maintenance |
| notify_low_compliance | BOOLEAN | Alert for low compliance |
| maintenance_due_days | INTEGER | Days before maintenance to alert (default: 7) |
| compliance_threshold | INTEGER | Compliance % threshold (default: 50) |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Base44 Mapping:**
- `Base44.NotificationPreferences` → `notification_preferences`

---

#### `email_digest_preferences`
**Purpose:** Email digest subscription settings

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| user_id | UUID | FK to auth.users |
| user_email | TEXT | User email (unique) |
| enabled | BOOLEAN | Digest enabled |
| frequency | TEXT | Frequency: daily, weekly, monthly |
| send_time | TIME | Preferred send time |
| include_compliance | BOOLEAN | Include compliance data |
| include_maintenance | BOOLEAN | Include maintenance data |
| include_alerts | BOOLEAN | Include alerts |
| include_activity | BOOLEAN | Include recent activity |
| only_if_changes | BOOLEAN | Only send if there are changes |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Base44 Mapping:**
- `Base44.EmailDigestPreference` → `email_digest_preferences`

---

#### `email_report_preferences`
**Purpose:** Scheduled email report settings

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| user_id | UUID | FK to auth.users |
| user_email | TEXT | User email (unique) |
| enabled | BOOLEAN | Reports enabled |
| frequency | TEXT | Frequency: daily, weekly, monthly |
| scheduled_time | TIME | Report send time |
| scheduled_day_of_week | INTEGER | Day of week (0=Sunday) for weekly |
| scheduled_day_of_month | INTEGER | Day of month for monthly |
| report_types | TEXT[] | Array of report types |
| include_charts | BOOLEAN | Include charts in reports |
| include_ai_insights | BOOLEAN | Include AI insights |
| last_sent | TIMESTAMPTZ | Last report sent timestamp |
| next_scheduled | TIMESTAMPTZ | Next scheduled send timestamp |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Base44 Mapping:**
- `Base44.EmailReportPreferences` → `email_report_preferences`

**Indexes:**
- `idx_email_report_prefs_next_scheduled` on `next_scheduled`

---

#### `client_branding`
**Purpose:** White-label branding configuration

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| client_email_domain | TEXT | Client email domain |
| company_name | TEXT | Display company name |
| logo_url | TEXT | Logo URL |
| primary_color | TEXT | Primary brand color (hex) |
| secondary_color | TEXT | Secondary brand color (hex) |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Base44 Mapping:**
- `Base44.Client_Branding` → `client_branding`

**Unique Constraint:** (company_id, client_email_domain)

---

## Row-Level Security (RLS) Policies

### General Principles

1. **Multi-tenant Isolation**: Users can only access data within their company
2. **User-Scoped Data**: Users can only view/modify their own preferences and favorites
3. **Admin Override**: Admin role users have elevated permissions
4. **Service Role Bypass**: Service role key bypasses all RLS for system operations

### Helper Functions

```sql
auth.user_company_id() → Returns company_id for current user
auth.is_admin() → Returns true if current user is admin
```

### Policy Examples

#### Companies Table
- **SELECT**: Users can view their own company; admins can view all
- **INSERT/UPDATE**: Admin only

#### User Profiles
- **SELECT**: Users can view profiles in their company
- **UPDATE**: Users can update their own profile

#### Compliance Targets
- **SELECT/INSERT/UPDATE/DELETE**: Users can manage their company's targets

#### Favorite Vehicles
- **SELECT/INSERT/DELETE**: Users can only manage their own favorites

#### Notifications
- **SELECT**: Users can view their own notifications
- **UPDATE**: Users can mark their own notifications as read

---

## External API Integration

The following data is **NOT** stored in the database but fetched from the external Elora API:

- **Vehicles** (`/api/vehicles`) - Fleet vehicle list
- **Scans/Washes** (`/api/scans`) - Vehicle wash records
- **Customers** (`/api/customers`) - Customer organizations
- **Sites** (`/api/sites`) - Wash site locations
- **Devices** (`/api/devices`) - IoT wash devices
- **Refills** (`/api/refills`) - Chemical refill records
- **Dashboard** (`/api/dashboard`) - Aggregated dashboard metrics

### Mapping Strategy

- External references (vehicle_ref, site_ref, customer_ref) are stored as TEXT columns
- No foreign key constraints to external data
- External data is fetched on-demand via Base44/Supabase Edge Functions
- Caching can be implemented at application layer if needed

---

## Migration from Base44

### Base44 Entities → PostgreSQL Tables

| Base44 Entity | PostgreSQL Table | Notes |
|---------------|------------------|-------|
| ComplianceTarget | compliance_targets | Direct migration |
| FavoriteVehicle | favorite_vehicles | Direct migration |
| EmailDigestPreference | email_digest_preferences | Direct migration |
| Maintenance | maintenance_records | Renamed for clarity |
| User | user_profiles | Extends Supabase Auth |
| Notification | notifications | Direct migration |
| NotificationPreferences | notification_preferences | Direct migration |
| Client_Branding | client_branding | Direct migration |
| EmailReportPreferences | email_report_preferences | Direct migration |

### Key Changes

1. **Authentication**: Base44 Auth → Supabase Auth
2. **Multi-tenancy**: Added `company_id` to all tables
3. **Timestamps**: Standardized `created_at` and `updated_at`
4. **Indexes**: Added performance indexes
5. **RLS**: Implemented Row-Level Security policies
6. **Types**: Snake_case column names for PostgreSQL convention

---

## Schema Statistics

- **Tables:** 10
- **Columns:** ~90
- **Indexes:** 33
- **Triggers:** 8 (auto-update timestamps)
- **RLS Policies:** 31
- **Helper Functions:** 3

---

## Migration Files

1. `20250112000001_initial_schema.sql` - Create all tables, indexes, triggers
2. `20250112000002_rls_policies.sql` - Enable RLS and create policies
3. `20250112000003_seed_test_data.sql` - Test data for Heidelberg Materials

---

## Testing the Schema

### Verification Queries

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- View all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Sample data
SELECT * FROM companies;
SELECT * FROM compliance_targets;
SELECT * FROM maintenance_records ORDER BY service_date DESC;
```

### Test Scenarios

1. **Create company and users**
2. **Set compliance targets**
3. **Add favorite vehicles**
4. **Create maintenance records**
5. **Test RLS with different user roles**
6. **Verify notification creation**

---

## Future Enhancements

Potential schema additions:

1. **Audit Logs** - Track all data changes
2. **Webhooks** - Event notifications for external systems
3. **Custom Reports** - Saved report configurations
4. **Fleet Analytics** - Aggregated performance metrics
5. **Document Storage** - Maintenance receipts, photos

---

## Support & Questions

For schema questions or migration issues:
- Review migration files in `/supabase/migrations`
- Check Supabase documentation: https://supabase.com/docs
- Test locally with `supabase start`

---

**Last Updated:** January 12, 2025
**Version:** 1.0.0
**Author:** Claude (Migration from Base44 to Supabase)
