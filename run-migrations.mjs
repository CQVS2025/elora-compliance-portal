import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase credentials
const SUPABASE_URL = 'https://mtjfypwrtvzhnzgatoim.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10amZ5cHdydHZ6aG56Z2F0b2ltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE0ODg2OSwiZXhwIjoyMDgzNzI0ODY5fQ.-fTX0HTe0xYdDC9JjW6jab6_Gh8wTWXGkAh2NdQR0TU';

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migration files in order
const migrations = [
  'supabase/migrations/20250112000001_initial_schema.sql',
  'supabase/migrations/20250112000002_rls_policies.sql',
  'supabase/migrations/20250112000003_seed_test_data.sql'
];

async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If the function doesn't exist, we need to execute SQL another way
      // Try using the REST API directly
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    }

    return data;
  } catch (err) {
    throw err;
  }
}

async function runMigrations() {
  console.log('🚀 Starting Supabase migrations...\n');

  for (const migrationFile of migrations) {
    try {
      console.log(`📄 Executing: ${migrationFile}`);

      // Read SQL file
      const sqlPath = join(__dirname, migrationFile);
      const sql = readFileSync(sqlPath, 'utf8');

      // Execute via direct PostgreSQL connection using fetch
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'params=single-object'
        },
        body: JSON.stringify({ query: sql })
      });

      // If that doesn't work, use pg-promise or raw SQL execution
      // For now, we'll use a simpler approach with psql
      console.log(`   Note: Using psql for execution...`);

      // Actually, let's try a different approach - split and execute via supabase
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`   Found ${statements.length} SQL statements`);

      // We can't execute raw SQL via the REST API easily
      // Let's save this for psql execution
      console.log(`   ✅ Prepared (will execute via psql)\n`);

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      throw error;
    }
  }

  console.log('✅ All migrations prepared!\n');
  console.log('Note: Supabase REST API does not support raw SQL execution.');
  console.log('We need to use the Supabase Dashboard SQL Editor or psql.\n');
}

runMigrations().catch(console.error);
