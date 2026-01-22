/**
 * Check Current Database State
 *
 * This script checks what tables and columns exist in the current Supabase database
 * to determine what migration steps are needed.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseState() {
  console.log('🔍 Checking current database state...\n');

  const results = {
    existingTables: [],
    missingTables: [],
    existingColumns: {},
    missingColumns: {},
    rlsStatus: {},
    summary: {
      needsSchemaV2: false,
      needsMigration: false
    }
  };

  // Tables we expect to exist after v2
  const expectedTables = [
    'profiles',
    'subscriptions',
    'usage_logs',
    'indesign_templates',
    'magazine_generations'
  ];

  // Check which tables exist
  console.log('📊 Checking tables...');
  for (const tableName of expectedTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (!error) {
      results.existingTables.push(tableName);
      console.log(`  ✅ ${tableName} exists`);
    } else if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      results.missingTables.push(tableName);
      console.log(`  ❌ ${tableName} missing`);
    } else if (error.code === '42501') {
      // RLS is blocking - table exists but we can't access it
      results.existingTables.push(tableName);
      console.log(`  ⚠️  ${tableName} exists (RLS enabled, no access)`);
    }
  }

  // Check for user_id column on existing tables
  console.log('\n📋 Checking columns on existing tables...');

  if (results.existingTables.includes('indesign_templates')) {
    const { data, error } = await supabase
      .from('indesign_templates')
      .select('*')
      .limit(1);

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      results.existingColumns.indesign_templates = columns;

      if (columns.includes('user_id')) {
        console.log('  ✅ indesign_templates has user_id column');
      } else {
        console.log('  ❌ indesign_templates missing user_id column');
        results.missingColumns.indesign_templates = ['user_id', 'visibility'];
      }
    } else if (!error || error.code === '42501') {
      // Table exists but empty or RLS blocked
      console.log('  ℹ️  indesign_templates exists but is empty or RLS blocked');
    }
  }

  if (results.existingTables.includes('magazine_generations')) {
    const { data, error } = await supabase
      .from('magazine_generations')
      .select('*')
      .limit(1);

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      results.existingColumns.magazine_generations = columns;

      if (columns.includes('user_id')) {
        console.log('  ✅ magazine_generations has user_id column');
      } else {
        console.log('  ❌ magazine_generations missing user_id column');
        results.missingColumns.magazine_generations = ['user_id'];
      }
    } else if (!error || error.code === '42501') {
      console.log('  ℹ️  magazine_generations exists but is empty or RLS blocked');
    }
  }

  // Check data counts
  console.log('\n📈 Checking data counts...');

  if (results.existingTables.includes('indesign_templates')) {
    const { count } = await supabase
      .from('indesign_templates')
      .select('*', { count: 'exact', head: true });
    console.log(`  Templates: ${count ?? 'unknown (RLS blocked)'}`);
  }

  if (results.existingTables.includes('magazine_generations')) {
    const { count } = await supabase
      .from('magazine_generations')
      .select('*', { count: 'exact', head: true });
    console.log(`  Generations: ${count ?? 'unknown (RLS blocked)'}`);
  }

  if (results.existingTables.includes('profiles')) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    console.log(`  Profiles: ${count ?? 'unknown (RLS blocked)'}`);
  }

  // Determine what needs to be done
  console.log('\n\n🎯 Migration Analysis:');
  console.log('═══════════════════════════════════════\n');

  if (results.missingTables.includes('profiles')) {
    results.summary.needsSchemaV2 = true;
    console.log('❗ NEW TABLES NEEDED:');
    console.log('   → profiles, subscriptions, usage_logs');
    console.log('   → ACTION: Execute supabase-schema-v2.sql\n');
  } else {
    console.log('✅ All new tables exist (profiles, subscriptions, usage_logs)\n');
  }

  if (Object.keys(results.missingColumns).length > 0) {
    results.summary.needsSchemaV2 = true;
    console.log('❗ COLUMNS NEED TO BE ADDED:');
    for (const [table, cols] of Object.entries(results.missingColumns)) {
      console.log(`   → ${table}: ${cols.join(', ')}`);
    }
    console.log('   → ACTION: Execute supabase-schema-v2.sql\n');
  } else if (results.existingTables.includes('indesign_templates') &&
             results.existingColumns.indesign_templates?.includes('user_id')) {
    console.log('✅ All columns exist on existing tables\n');
  }

  // Check if we need migration
  if (results.existingTables.includes('indesign_templates') ||
      results.existingTables.includes('magazine_generations')) {
    results.summary.needsMigration = true;
    console.log('❗ DATA MIGRATION NEEDED:');
    console.log('   → Existing templates/generations need user_id assignment');
    console.log('   → ACTION: Execute 001_add_multiuser.sql after schema v2\n');
  }

  // Final recommendations
  console.log('\n📝 RECOMMENDED ACTIONS:\n');

  if (results.summary.needsSchemaV2) {
    console.log('1️⃣  Execute supabase-schema-v2.sql in Supabase SQL Editor');
    console.log('    → Creates new tables (profiles, subscriptions, usage_logs)');
    console.log('    → Adds user_id columns to existing tables');
    console.log('    → Enables RLS on all tables\n');
  }

  if (results.summary.needsMigration) {
    console.log('2️⃣  Create admin user in Supabase Auth Dashboard\n');
    console.log('3️⃣  Execute 001_add_multiuser.sql with admin email');
    console.log('    → Migrates existing data to admin user');
    console.log('    → Sets NOT NULL constraints on user_id\n');
  }

  if (!results.summary.needsSchemaV2 && !results.summary.needsMigration) {
    console.log('✅ Database is already up to date!');
    console.log('   No migration needed.\n');
  }

  return results;
}

// Run the check
checkDatabaseState()
  .then(() => {
    console.log('\n✅ Database state check complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error checking database state:', error.message);
    process.exit(1);
  });
