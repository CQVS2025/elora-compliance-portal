# ELORA Fleet Compliance Portal - Deployment Guide

## 🚀 Quick Deployment to Supabase Cloud

### **Method 1: Supabase Dashboard SQL Editor (EASIEST - No CLI Required)**

This is the **recommended method** for quick deployment.

#### Step-by-Step:

1. **Open Supabase SQL Editor**
   - Go to: https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/sql/new

2. **Deploy Migration 1: Initial Schema**
   - Open file: `supabase/migrations/20250112000001_initial_schema.sql`
   - Copy the ENTIRE contents
   - Paste into SQL Editor
   - Click **"Run"** button
   - ✅ Verify: Should show "Success. No rows returned"

3. **Deploy Migration 2: RLS Policies**
   - Open file: `supabase/migrations/20250112000002_rls_policies.sql`
   - Copy the ENTIRE contents
   - Paste into SQL Editor (replace previous query)
   - Click **"Run"** button
   - ✅ Verify: Should show "Success. No rows returned"

4. **Deploy Migration 3: Seed Data**
   - Open file: `supabase/migrations/20250112000003_seed_test_data.sql`
   - Copy the ENTIRE contents
   - Paste into SQL Editor (replace previous query)
   - Click **"Run"** button
   - ✅ Verify: Should show "Success. No rows returned"

5. **Verify Deployment**
   - Go to **Table Editor**: https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/editor
   - You should see 10 tables:
     - companies
     - user_profiles
     - compliance_targets
     - favorite_vehicles
     - maintenance_records
     - notifications
     - notification_preferences
     - email_digest_preferences
     - email_report_preferences
     - client_branding

6. **Check RLS Policies**
   - Go to **Authentication → Policies**
   - You should see 31 policies across all tables

7. **View Seed Data**
   - In Table Editor, click on `companies` table
   - You should see "Heidelberg Materials" company
   - Click on `maintenance_records` table
   - You should see 10 maintenance records

✅ **DEPLOYMENT COMPLETE!**

---

### **Method 2: Supabase CLI (For Advanced Users)**

If you prefer using the CLI:

#### Prerequisites:
- Supabase CLI installed
- Supabase account access

#### Steps:

```bash
# 1. Login to Supabase
supabase login

# 2. Link to project
supabase link --project-ref mtjfypwrtvzhnzgatoim

# 3. Push migrations
supabase db push
```

---

### **Method 3: Direct PostgreSQL Connection**

If you have PostgreSQL client installed:

#### Prerequisites:
- PostgreSQL client (`psql`) installed
- Database password from Supabase dashboard

#### Steps:

```bash
# Run the deployment script
bash scripts/deploy-direct.sh
```

When prompted, enter your database password (get it from Supabase Dashboard → Settings → Database)

---

## 🎯 After Deployment

### 1. Create Test Users

Go to **Authentication → Users**: https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/auth/users

Click **"Add user"** and create:

**Admin User:**
- Email: `admin@heidelberg.com.au`
- Password: (choose a strong password)
- Auto-confirm email: ✅ Yes

**Regular User:**
- Email: `user@heidelberg.com.au`
- Password: (choose a strong password)
- Auto-confirm email: ✅ Yes

### 2. Create User Profiles

After creating auth users, you need to add their profiles. Go to **SQL Editor** and run:

```sql
-- Get the user IDs first
SELECT id, email FROM auth.users;

-- Create profile for admin user (replace USER_ID with actual ID)
INSERT INTO user_profiles (id, company_id, email, full_name, role, is_active)
VALUES (
    'ADMIN_USER_ID_HERE'::uuid,
    'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
    'admin@heidelberg.com.au',
    'Admin User',
    'admin',
    true
);

-- Create profile for regular user (replace USER_ID with actual ID)
INSERT INTO user_profiles (id, company_id, email, full_name, role, is_active)
VALUES (
    'REGULAR_USER_ID_HERE'::uuid,
    'hm-001-uuid-4a8b-9c3d-e2f1a5b6c7d8'::uuid,
    'user@heidelberg.com.au',
    'Regular User',
    'user',
    true
);
```

**OR** use the helper function:

```sql
-- For admin user
SELECT create_user_profile(
    'ADMIN_USER_ID_HERE'::uuid,
    'admin@heidelberg.com.au',
    'Admin User',
    'admin'
);

-- For regular user
SELECT create_user_profile(
    'REGULAR_USER_ID_HERE'::uuid,
    'user@heidelberg.com.au',
    'Regular User',
    'user'
);
```

### 3. Test the Setup

1. **Verify Tables**
   ```sql
   SELECT * FROM companies;
   SELECT * FROM compliance_targets;
   SELECT * FROM maintenance_records ORDER BY service_date DESC;
   ```

2. **Test RLS**
   - Try logging in as different users
   - Verify each user can only see their company's data

3. **Check Notifications**
   - Maintenance due/overdue items should be visible
   - Can create custom compliance targets

---

## 📋 Verification Checklist

After deployment, verify:

- [ ] 10 tables created in database
- [ ] 31 RLS policies active
- [ ] Heidelberg Materials company exists
- [ ] 3 compliance targets created
- [ ] 10 maintenance records exist
- [ ] Admin user created and has profile
- [ ] Regular user created and has profile
- [ ] Users can only see their company data
- [ ] Service role can access all data

---

## 🆘 Troubleshooting

### "Permission denied" errors
- Check that RLS policies are enabled
- Verify user has a profile with company_id
- Use service role key for admin operations

### "Table does not exist" errors
- Ensure migrations ran in order (001 → 002 → 003)
- Check SQL Editor for error messages
- Verify you're in the correct project

### "Foreign key constraint" errors
- Ensure migration 001 (schema) ran successfully before others
- Check that company and auth users exist

### Can't create user profiles
- First create users via Authentication → Users
- Then add profiles using their UUID from auth.users

---

## 🎉 Success!

Once all steps are complete:

✅ Your database schema is deployed
✅ Test data is available
✅ RLS is protecting your data
✅ Users can be created and authenticated

**Next:** Update your frontend to use Supabase instead of Base44!

---

## 📚 Resources

- **Supabase Dashboard**: https://app.supabase.com/project/mtjfypwrtvzhnzgatoim
- **Table Editor**: https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/editor
- **SQL Editor**: https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/sql/new
- **Authentication**: https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/auth/users
- **Schema Documentation**: [docs/SCHEMA_DESIGN.md](docs/SCHEMA_DESIGN.md)

---

**Need help?** Check the [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) for complete migration details.
