# 🚀 ELORA Fleet Compliance Portal - Supabase Database Setup

Complete guide to setting up your Supabase database for the ELORA Fleet Compliance Portal.

## Quick Start (Recommended)

### Option 1: One-Click Web Interface ⭐ EASIEST

1. **Open the HTML helper:**
   ```bash
   open execute-migrations.html
   ```
   or double-click `execute-migrations.html` in your file browser

2. **Follow the 3-step wizard:**
   - Step 1: Click "Copy SQL to Clipboard"
   - Step 2: Open Supabase SQL Editor
   - Step 3: Paste and Run

3. **Done!** Your database is ready.

---

### Option 2: Manual SQL Editor Execution

1. **Open Supabase SQL Editor:**
   https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/sql/new

2. **Open the SQL file:**
   `supabase-setup-complete.sql`

3. **Copy ALL contents** (889 lines)

4. **Paste into SQL Editor**

5. **Click "Run"** (or press Ctrl+Enter)

6. **Wait for success** (5-10 seconds)

---

### Option 3: Command Line (Requires DB Password)

If you prefer using `psql`:

```bash
# Get your database password from:
# https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/settings/database

PGPASSWORD="your-db-password" psql \
  -h db.mtjfypwrtvzhnzgatoim.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f supabase-setup-complete.sql
```

---

## What Gets Created

### Database Schema

The migration creates a complete multi-tenant database with:

| Component | Count | Description |
|-----------|-------|-------------|
| **Tables** | 10 | Core application tables |
| **Indexes** | 33 | Optimized query performance |
| **RLS Policies** | 31 | Row-level security for multi-tenancy |
| **Triggers** | 8 | Auto-update timestamps |
| **Functions** | 3 | Helper functions for RLS |

### Tables Created

1. **companies** - Multi-tenant organization data
2. **user_profiles** - Extended user information (links to Supabase Auth)
3. **client_branding** - White-label customization
4. **compliance_targets** - Wash frequency targets (configurable per site/vehicle)
5. **favorite_vehicles** - User bookmarks
6. **maintenance_records** - Fleet maintenance tracking
7. **notifications** - User notifications and alerts
8. **notification_preferences** - User notification settings
9. **email_digest_preferences** - Email digest subscriptions
10. **email_report_preferences** - Scheduled report preferences

### Sample Data Included

The migration includes test data for **Heidelberg Materials**:
- ✅ 1 company (Heidelberg Materials)
- ✅ 3 compliance targets (global, site-specific, vehicle-specific)
- ✅ 10 maintenance records (recent, upcoming, and overdue services)
- ✅ Client branding configuration

---

## Verification

After running the migration, verify everything is set up correctly:

### 1. Check Tables Created

Visit: https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/editor

You should see 10 tables listed:
- ✓ companies
- ✓ user_profiles
- ✓ client_branding
- ✓ compliance_targets
- ✓ favorite_vehicles
- ✓ maintenance_records
- ✓ notifications
- ✓ notification_preferences
- ✓ email_digest_preferences
- ✓ email_report_preferences

### 2. Verify Sample Data

Run this query in the SQL Editor:

```sql
-- Check companies
SELECT * FROM companies;

-- Check compliance targets
SELECT * FROM compliance_targets;

-- Check maintenance records
SELECT * FROM maintenance_records ORDER BY service_date DESC;
```

You should see:
- 1 row in `companies` (Heidelberg Materials)
- 3 rows in `compliance_targets`
- 10 rows in `maintenance_records`

### 3. Verify RLS is Enabled

Run this query:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`.

---

## Next Steps

### 1. Create Test Users

You need to create Supabase Auth users before you can log in:

**Go to:** https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/auth/users

**Create these test users:**

1. **Admin User:**
   - Email: `admin@heidelberg.com.au`
   - Password: (choose a secure password)
   - Email Confirm: ✅ (mark as confirmed)

2. **Regular User:**
   - Email: `user@heidelberg.com.au`
   - Password: (choose a secure password)
   - Email Confirm: ✅ (mark as confirmed)

### 2. Create User Profiles

After creating the Auth users, create their profiles by running this in SQL Editor:

```sql
-- Replace 'USER_ID_FROM_AUTH' with the actual UUID from auth.users table

-- Admin profile
SELECT public.create_user_profile(
    'USER_ID_FROM_AUTH'::uuid,
    'admin@heidelberg.com.au',
    'Admin User',
    'admin'
);

-- Regular user profile
SELECT public.create_user_profile(
    'USER_ID_FROM_AUTH'::uuid,
    'user@heidelberg.com.au',
    'Regular User',
    'user'
);
```

**Tip:** Get the user IDs from the Auth Users page or run:
```sql
SELECT id, email FROM auth.users;
```

### 3. Update Application Configuration

Your `.env` file has been updated with Supabase credentials:

```env
VITE_SUPABASE_URL=https://mtjfypwrtvzhnzgatoim.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Test the Application

```bash
npm run dev
```

Try logging in with your test users!

---

## Migration Files

The database setup is composed of 3 migration files:

1. **`20250112000001_initial_schema.sql`**
   - Creates all tables, indexes, and triggers
   - Sets up the multi-tenant schema with company_id

2. **`20250112000002_rls_policies.sql`**
   - Enables Row-Level Security (RLS) on all tables
   - Creates 31 security policies for data isolation
   - Defines helper functions for RLS

3. **`20250112000003_seed_test_data.sql`**
   - Inserts Heidelberg Materials test company
   - Adds sample compliance targets
   - Creates sample maintenance records

---

## Troubleshooting

### ❌ "relation already exists" error

The migration has already been run. To reset:

```sql
-- WARNING: This deletes ALL data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then run the migration again.

### ❌ "permission denied" error

Make sure you're logged in to the correct Supabase project and have owner/admin access.

### ❌ Tables created but empty

Check if the seed data migration ran. You can run just the seed data:

```bash
# Open supabase/migrations/20250112000003_seed_test_data.sql
# Copy and paste into SQL Editor
```

### ❌ Can't log in after creating users

Make sure to:
1. Create user profiles using the `create_user_profile()` function
2. Mark email as confirmed in Supabase Auth dashboard
3. Use correct email/password

---

## Architecture Notes

### Multi-Tenancy

The database uses a **row-level security (RLS)** approach for multi-tenancy:

- Every table has a `company_id` column
- RLS policies automatically filter data based on the authenticated user's company
- Users can only see data belonging to their company
- Service role can bypass RLS for system operations

### Authentication Flow

1. User signs up via Supabase Auth
2. Trigger/function creates user profile in `user_profiles` table
3. User profile linked to a company via `company_id`
4. RLS policies enforce data isolation using `auth.user_company_id()`

### External Data Integration

The system is designed to integrate with external ELORA API:

- `companies.elora_customer_ref` - Maps to external customer reference
- `user_profiles.assigned_sites` - Array of external site IDs
- `user_profiles.assigned_vehicles` - Array of external vehicle IDs
- `maintenance_records.vehicle_id` - External vehicle reference

---

## Support

### Useful Links

- **SQL Editor:** https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/sql/new
- **Table Editor:** https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/editor
- **Auth Users:** https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/auth/users
- **Database Settings:** https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/settings/database

### Helper Scripts

- `execute-migrations.html` - Web UI for easy migration execution
- `setup-database.mjs` - Node.js script for programmatic execution
- `supabase-setup-complete.sql` - Combined migration SQL file

---

## Security Notes

⚠️ **Important Security Reminders:**

1. **Never expose Service Role Key** in client-side code
2. **Always use Anon Key** for client applications
3. **RLS policies are critical** - never disable them in production
4. **Validate all user input** before database operations
5. **Use prepared statements** to prevent SQL injection

---

**Need help?** Check the Supabase documentation at https://supabase.com/docs
