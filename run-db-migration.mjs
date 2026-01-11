#!/usr/bin/env node

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection config
const connectionString = 'postgresql://postgres:cqvs@lorne5@db.mtjfypwrtvzhnzgatoim.supabase.co:5432/postgres';

async function runMigration() {
  console.log('🚀 Starting Supabase database migration...\n');
  console.log('📍 Connecting to: db.mtjfypwrtvzhnzgatoim.supabase.co');
  console.log('📊 Database: postgres\n');

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Connect
    console.log('🔌 Connecting...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read SQL file
    const sqlPath = join(__dirname, 'supabase-setup-complete.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('📄 Executing migration SQL (889 lines)...');
    console.log('⏳ This may take 10-20 seconds...\n');

    // Execute
    const startTime = Date.now();
    await client.query(sql);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ MIGRATION COMPLETED SUCCESSFULLY! (${duration}s)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verify tables created
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`\n✅ ${result.rows.length} tables created:\n`);
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Check sample data
    console.log('\n🔍 Verifying sample data...');

    const companies = await client.query('SELECT COUNT(*) FROM companies');
    const targets = await client.query('SELECT COUNT(*) FROM compliance_targets');
    const maintenance = await client.query('SELECT COUNT(*) FROM maintenance_records');

    console.log(`\n✅ Sample data loaded:\n`);
    console.log(`   • Companies: ${companies.rows[0].count}`);
    console.log(`   • Compliance Targets: ${targets.rows[0].count}`);
    console.log(`   • Maintenance Records: ${maintenance.rows[0].count}`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 NEXT STEPS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Create test users in Supabase Auth:');
    console.log('   https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/auth/users\n');
    console.log('   Add these users:');
    console.log('   • admin@heidelberg.com.au (mark as email confirmed)');
    console.log('   • user@heidelberg.com.au (mark as email confirmed)\n');
    console.log('2. View your tables:');
    console.log('   https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/editor\n');
    console.log('3. Start your application:');
    console.log('   npm run dev\n');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED!');
    console.error('Error:', error.message);

    if (error.message.includes('already exists')) {
      console.log('\n💡 TIP: Tables already exist. To reset and re-run:');
      console.log('   1. Go to SQL Editor: https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/sql/new');
      console.log('   2. Run: DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      console.log('   3. Run this script again');
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);
