#!/usr/bin/env node

/**
 * Supabase Database Setup Script
 * Executes all migration files to set up the ELORA Fleet Compliance Portal database
 */

import { Client } from 'pg';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase credentials
const SUPABASE_PROJECT_REF = 'mtjfypwrtvzhnzgatoim';
const SUPABASE_URL = 'https://mtjfypwrtvzhnzgatoim.supabase.co';

// Database connection config
// For Supabase, the connection uses pooler connection string
const DB_CONFIG = {
  host: `db.${SUPABASE_PROJECT_REF}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || '', // Get from environment or prompt
  ssl: {
    rejectUnauthorized: false
  }
};

// Migration files in order
const migrations = [
  'supabase/migrations/20250112000001_initial_schema.sql',
  'supabase/migrations/20250112000002_rls_policies.sql',
  'supabase/migrations/20250112000003_seed_test_data.sql'
];

async function runMigrations() {
  if (!DB_CONFIG.password) {
    console.error('❌ ERROR: Database password not provided!\n');
    console.log('Please set the SUPABASE_DB_PASSWORD environment variable:');
    console.log('');
    console.log('  export SUPABASE_DB_PASSWORD="your-password-here"');
    console.log('  node setup-database.mjs');
    console.log('');
    console.log('Or get your database password from:');
    console.log(`  https://app.supabase.com/project/${SUPABASE_PROJECT_REF}/settings/database`);
    console.log('');
    console.log('📋 ALTERNATIVE: Use the Supabase Dashboard SQL Editor');
    console.log('Run this instead: node setup-database.mjs --generate-sql');
    console.log('');
    process.exit(1);
  }

  console.log('🚀 Starting Supabase database setup...\n');
  console.log(`📍 Connecting to: ${DB_CONFIG.host}`);
  console.log(`📊 Database: ${DB_CONFIG.database}\n`);

  const client = new Client(DB_CONFIG);

  try {
    // Connect to database
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Execute each migration file
    for (let i = 0; i < migrations.length; i++) {
      const migrationFile = migrations[i];
      const migrationNum = i + 1;

      console.log(`📄 [${migrationNum}/${migrations.length}] Executing: ${migrationFile}`);

      try {
        // Read SQL file
        const sqlPath = join(__dirname, migrationFile);
        const sql = readFileSync(sqlPath, 'utf8');

        // Execute SQL
        await client.query(sql);

        console.log(`   ✅ Success!\n`);
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📊 Database Schema Created:');
    console.log('   • 10 tables created');
    console.log('   • 33 indexes created');
    console.log('   • 31 RLS policies enabled');
    console.log('   • Sample data for Heidelberg Materials\n');

    console.log('🎯 Next Steps:');
    console.log('   1. Create test users in Supabase Auth:');
    console.log(`      https://app.supabase.com/project/${SUPABASE_PROJECT_REF}/auth/users`);
    console.log('      • admin@heidelberg.com.au (admin role)');
    console.log('      • user@heidelberg.com.au (user role)\n');
    console.log('   2. Verify tables in Table Editor:');
    console.log(`      https://app.supabase.com/project/${SUPABASE_PROJECT_REF}/editor\n`);
    console.log('   3. Update your application .env file with Supabase credentials\n');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED!');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Generate SQL file for manual execution
function generateSqlFile() {
  console.log('📝 Generating combined SQL file for manual execution...\n');

  let combinedSql = `-- ELORA Fleet Compliance Portal - Complete Database Setup
-- Generated: ${new Date().toISOString()}
-- Execute this in Supabase SQL Editor: https://app.supabase.com/project/${SUPABASE_PROJECT_REF}/sql/new

`;

  for (const migrationFile of migrations) {
    const sqlPath = join(__dirname, migrationFile);
    const sql = readFileSync(sqlPath, 'utf8');

    combinedSql += `\n-- =====================================================================\n`;
    combinedSql += `-- ${migrationFile}\n`;
    combinedSql += `-- =====================================================================\n\n`;
    combinedSql += sql;
    combinedSql += '\n\n';
  }

  const outputPath = join(__dirname, 'supabase-setup-complete.sql');
  writeFileSync(outputPath, combinedSql, 'utf8');

  console.log(`✅ SQL file generated: ${outputPath}\n`);
  console.log('📋 INSTRUCTIONS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('1. Open Supabase SQL Editor:');
  console.log(`   https://app.supabase.com/project/${SUPABASE_PROJECT_REF}/sql/new\n`);
  console.log('2. Copy the contents of: supabase-setup-complete.sql\n');
  console.log('3. Paste into the SQL Editor\n');
  console.log('4. Click "Run" button\n');
  console.log('5. Verify tables created in Table Editor:');
  console.log(`   https://app.supabase.com/project/${SUPABASE_PROJECT_REF}/editor\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--generate-sql') || args.includes('-g')) {
  generateSqlFile();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log('Supabase Database Setup Script\n');
  console.log('Usage:');
  console.log('  node setup-database.mjs                  Run migrations via database connection');
  console.log('  node setup-database.mjs --generate-sql   Generate SQL file for manual execution');
  console.log('  node setup-database.mjs --help           Show this help\n');
  console.log('Environment Variables:');
  console.log('  SUPABASE_DB_PASSWORD    PostgreSQL database password\n');
} else {
  runMigrations().catch(console.error);
}
