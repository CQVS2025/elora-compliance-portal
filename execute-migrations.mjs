#!/usr/bin/env node

/**
 * Execute Supabase migrations using HTTP API
 * This script uses the Supabase service role to execute SQL
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase credentials
const SUPABASE_URL = 'https://mtjfypwrtvzhnzgatoim.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10amZ5cHdydHZ6aG56Z2F0b2ltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE0ODg2OSwiZXhwIjoyMDgzNzI0ODY5fQ.-fTX0HTe0xYdDC9JjW6jab6_Gh8wTWXGkAh2NdQR0TU';

// Read the combined SQL file
const sqlPath = join(__dirname, 'supabase-setup-complete.sql');
const fullSql = readFileSync(sqlPath, 'utf8');

console.log('🚀 Executing Supabase database setup...\n');
console.log('📍 Project: mtjfypwrtvzhnzgatoim');
console.log('🔐 Using service role authentication\n');

// Split SQL into individual statements
// This is a simple split - may need refinement for complex SQL
const statements = fullSql
  .split(';')
  .map(s => s.trim())
  .filter(s => {
    // Filter out empty statements and comment-only lines
    if (!s) return false;
    const lines = s.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('--');
    });
    return lines.length > 0;
  });

console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Try to execute via direct query (this might not work for DDL)
async function executeViaQuery() {
  try {
    console.log('Attempting to execute migrations...\n');

    // Try executing the full SQL as one command
    const { data, error } = await supabase.rpc('exec', { sql: fullSql });

    if (error) {
      console.error('❌ Error executing via RPC:', error.message);
      console.log('\n⚠️  The Supabase REST API does not support raw SQL execution.');
      console.log('    You need to use the SQL Editor in the dashboard.\n');
      return false;
    }

    console.log('✅ Migrations executed successfully!');
    return true;

  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

// Alternative: Display manual instructions
function showManualInstructions() {
  console.log('📋 MANUAL EXECUTION REQUIRED\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('The Supabase REST API does not allow direct SQL execution.');
  console.log('Please follow these steps:\n');
  console.log('1️⃣  Open Supabase SQL Editor:');
  console.log('   https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/sql/new\n');
  console.log('2️⃣  Open the generated SQL file:');
  console.log('   supabase-setup-complete.sql\n');
  console.log('3️⃣  Copy ALL contents of the file\n');
  console.log('4️⃣  Paste into the SQL Editor\n');
  console.log('5️⃣  Click the "Run" button (or press Ctrl+Enter)\n');
  console.log('6️⃣  Wait for execution to complete\n');
  console.log('7️⃣  Verify tables were created:');
  console.log('   https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/editor\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Expected result: 10 tables created with sample data\n');
}

// Execute
async function main() {
  const success = await executeViaQuery();

  if (!success) {
    showManualInstructions();
    console.log('\n💡 TIP: You can also connect via psql:');
    console.log('   PGPASSWORD="your-db-password" psql -h db.mtjfypwrtvzhnzgatoim.supabase.co -p 5432 -U postgres -d postgres -f supabase-setup-complete.sql');
    console.log('\n   Get your database password from:');
    console.log('   https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/settings/database\n');
  }
}

main().catch(console.error);
