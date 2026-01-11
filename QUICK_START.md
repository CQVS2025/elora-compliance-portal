# 🚀 Quick Start - Execute Database Migration

You have everything ready! Choose the easiest method for you:

---

## ⭐ Method 1: Supabase SQL Editor (EASIEST - Recommended)

### Step 1: Open SQL Editor
Click here: https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/sql/new

### Step 2: Copy the SQL
Open the file: `supabase-setup-complete.sql` (889 lines)

**OR** use the web helper:
- Open: `execute-migrations.html` in your browser
- Click "Copy SQL to Clipboard"

### Step 3: Paste and Run
- Paste all the SQL into the editor
- Click **"Run"** button (or press Ctrl+Enter)
- Wait 5-10 seconds

### Step 4: Verify
Tables created: https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/editor

**Done!** ✅

---

## 🖥️ Method 2: Command Line (psql)

If you have `psql` installed on your local machine:

```bash
PGPASSWORD="cqvs@lorne5" psql \
  -h db.mtjfypwrtvzhnzgatoim.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f supabase-setup-complete.sql
```

**Or using connection string:**

```bash
psql "postgresql://postgres:cqvs@lorne5@db.mtjfypwrtvzhnzgatoim.supabase.co:5432/postgres" \
  -f supabase-setup-complete.sql
```

---

## 🔧 Method 3: Node.js Script (From Your Local Machine)

Run this from your local machine (not the sandboxed environment):

```bash
node run-db-migration.mjs
```

This will automatically:
- Connect to your Supabase database
- Execute all migrations
- Verify tables were created
- Show sample data counts

---

## ✅ What Will Be Created

When you run the migration, you'll get:

- **10 tables** (companies, user_profiles, compliance_targets, etc.)
- **33 indexes** for performance
- **31 RLS policies** for security
- **Sample data** for Heidelberg Materials:
  - 1 company
  - 3 compliance targets
  - 10 maintenance records

---

## 🎯 After Migration

### 1. Create Test Users

Go to: https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/auth/users

Add these users:
- **Email:** admin@heidelberg.com.au
  - **Password:** (choose one)
  - ✅ Mark as "Email Confirmed"

- **Email:** user@heidelberg.com.au
  - **Password:** (choose one)
  - ✅ Mark as "Email Confirmed"

### 2. Create User Profiles

After creating the Auth users, run this in SQL Editor:

```sql
-- Get the user IDs first
SELECT id, email FROM auth.users;

-- Then create profiles (replace USER_ID with actual IDs from above)
SELECT public.create_user_profile(
    'USER_ID_HERE'::uuid,
    'admin@heidelberg.com.au',
    'Admin User',
    'admin'
);

SELECT public.create_user_profile(
    'USER_ID_HERE'::uuid,
    'user@heidelberg.com.au',
    'Regular User',
    'user'
);
```

### 3. Test Your Application

```bash
npm run dev
```

Log in with your test users!

---

## 🔍 Verification Queries

After migration, run these in SQL Editor to verify:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Should return 10 tables

-- Check sample data
SELECT * FROM companies;
SELECT * FROM compliance_targets;
SELECT * FROM maintenance_records ORDER BY service_date DESC;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All should show rowsecurity = true
```

---

## 📚 Full Documentation

For detailed information, see: **`DATABASE_SETUP.md`**

---

## 🆘 Troubleshooting

### "relation already exists" error
The migration was already run. To reset:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then run migration again.

### Can't connect via psql
Make sure you're running from your local machine (not this sandboxed environment), or just use the SQL Editor in Supabase dashboard.

---

## 🎉 You're All Set!

Your database credentials are already configured in `.env`:
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY

Just run the migration and start building! 🚀
