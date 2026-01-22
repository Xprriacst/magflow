/**
 * Automated Migration Script: v1.0 → v2.0
 *
 * This script automates the complete migration from single-user to multi-user SaaS.
 * It executes SQL files directly using Supabase service_role key.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = 'alexandre.errasti@gmail.com';
const ADMIN_PASSWORD = 'MagFlow2024Admin!'; // Change this after first login

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

// Create admin client with service_role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Execute raw SQL via Supabase RPC
 */
async function executeSql(sql, stepName) {
  console.log(`\n🔄 ${stepName}...`);

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error(`❌ Error in ${stepName}:`, error.message);
      return false;
    }

    console.log(`✅ ${stepName} completed successfully`);
    return true;
  } catch (err) {
    console.error(`❌ Exception in ${stepName}:`, err.message);
    return false;
  }
}

/**
 * Step 1: Check current database state
 */
async function checkCurrentState() {
  console.log('\n═══════════════════════════════════════');
  console.log('📊 STEP 1: Checking Current Database State');
  console.log('═══════════════════════════════════════\n');

  // Check if profiles table exists
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  const profilesExists = !profilesError;

  // Check if indesign_templates exists
  const { data: templatesData, error: templatesError } = await supabase
    .from('indesign_templates')
    .select('*')
    .limit(1);

  const templatesExist = !templatesError;

  // Check templates count
  const { count: templatesCount } = await supabase
    .from('indesign_templates')
    .select('*', { count: 'exact', head: true });

  // Check generations count
  const { count: generationsCount } = await supabase
    .from('magazine_generations')
    .select('*', { count: 'exact', head: true });

  console.log('Current State:');
  console.log(`  profiles table: ${profilesExists ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`  indesign_templates: ${templatesExist ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`  Templates count: ${templatesCount ?? 0}`);
  console.log(`  Generations count: ${generationsCount ?? 0}`);

  return {
    profilesExists,
    templatesExist,
    templatesCount: templatesCount ?? 0,
    generationsCount: generationsCount ?? 0,
    needsMigration: !profilesExists
  };
}

/**
 * Step 2: Create exec_sql RPC function (needed to execute raw SQL)
 */
async function createExecSqlFunction() {
  console.log('\n═══════════════════════════════════════');
  console.log('🔧 STEP 2: Creating SQL Execution Function');
  console.log('═══════════════════════════════════════\n');

  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN 'Success';
    EXCEPTION WHEN OTHERS THEN
      RETURN 'Error: ' || SQLERRM;
    END;
    $$;
  `;

  // We need to execute this via the REST API directly
  const { error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });

  if (error && error.message.includes('function')) {
    console.log('⚠️  exec_sql function does not exist, creating it...');

    // Unfortunately, we can't create functions via the JS client easily
    // We need to use the Supabase Management API or SQL Editor
    console.log('❌ Cannot create exec_sql function programmatically');
    console.log('');
    console.log('Please run this SQL in Supabase SQL Editor first:');
    console.log('─────────────────────────────────────');
    console.log(createFunctionSql);
    console.log('─────────────────────────────────────');
    return false;
  }

  console.log('✅ exec_sql function ready');
  return true;
}

/**
 * Step 3: Execute Schema v2
 */
async function executeSchemaV2() {
  console.log('\n═══════════════════════════════════════');
  console.log('🗄️  STEP 3: Executing Schema v2');
  console.log('═══════════════════════════════════════\n');

  const schemaPath = resolve(__dirname, '../supabase-schema-v2.sql');
  const schemaSql = readFileSync(schemaPath, 'utf-8');

  // Split SQL into statements (basic split by semicolon, handle DO blocks)
  const statements = schemaSql.split(/;(?=\s*(?:--|$|\n))/);

  console.log(`📝 Found ${statements.length} SQL statements to execute`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt || stmt.startsWith('--')) continue;

    console.log(`  Executing statement ${i + 1}/${statements.length}...`);

    const success = await executeSql(stmt, `Statement ${i + 1}`);
    if (!success) {
      console.error(`❌ Failed at statement ${i + 1}`);
      console.error('Statement:', stmt.substring(0, 100) + '...');
      return false;
    }
  }

  console.log('\n✅ Schema v2 executed successfully');
  return true;
}

/**
 * Step 4: Create admin user
 */
async function createAdminUser() {
  console.log('\n═══════════════════════════════════════');
  console.log('👤 STEP 4: Creating Admin User');
  console.log('═══════════════════════════════════════\n');

  // Check if admin already exists
  const { data: existingUser } = await supabase.auth.admin.listUsers();
  const adminExists = existingUser?.users.find(u => u.email === ADMIN_EMAIL);

  if (adminExists) {
    console.log(`✅ Admin user already exists: ${ADMIN_EMAIL}`);
    console.log(`   UUID: ${adminExists.id}`);
    return adminExists.id;
  }

  // Create new admin user
  console.log(`Creating admin user: ${ADMIN_EMAIL}`);

  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      role: 'admin'
    }
  });

  if (error) {
    console.error('❌ Error creating admin user:', error.message);
    return null;
  }

  console.log(`✅ Admin user created successfully`);
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   UUID: ${data.user.id}`);
  console.log(`   ⚠️  IMPORTANT: Change password after first login!`);

  return data.user.id;
}

/**
 * Step 5: Execute Migration Script
 */
async function executeMigration(adminUserId) {
  console.log('\n═══════════════════════════════════════');
  console.log('🔄 STEP 5: Executing Migration Script');
  console.log('═══════════════════════════════════════\n');

  const migrationPath = resolve(__dirname, '../migrations/001_add_multiuser.sql');
  let migrationSql = readFileSync(migrationPath, 'utf-8');

  // Replace placeholder email with actual admin email
  migrationSql = migrationSql.replaceAll(
    'REPLACE_WITH_YOUR_ADMIN_EMAIL@example.com',
    ADMIN_EMAIL
  );

  console.log(`📝 Migration script prepared for: ${ADMIN_EMAIL}`);

  const success = await executeSql(migrationSql, 'Migration 001');

  if (!success) {
    console.error('❌ Migration failed');
    return false;
  }

  console.log('\n✅ Migration completed successfully');
  return true;
}

/**
 * Step 6: Verify migration success
 */
async function verifyMigration() {
  console.log('\n═══════════════════════════════════════');
  console.log('✅ STEP 6: Verifying Migration');
  console.log('═══════════════════════════════════════\n');

  // Check profiles
  const { count: profilesCount, error: profilesError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Check templates with user_id
  const { count: templatesCount } = await supabase
    .from('indesign_templates')
    .select('*', { count: 'exact', head: true });

  // Check for orphaned templates
  const { count: orphanedTemplates } = await supabase
    .from('indesign_templates')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null);

  // Check for orphaned generations
  const { count: orphanedGenerations } = await supabase
    .from('magazine_generations')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null);

  console.log('Migration Verification:');
  console.log(`  Profiles created: ${profilesCount ?? 0}`);
  console.log(`  Templates: ${templatesCount ?? 0}`);
  console.log(`  Orphaned templates: ${orphanedTemplates ?? 0}`);
  console.log(`  Orphaned generations: ${orphanedGenerations ?? 0}`);

  const success = (profilesCount > 0) && (orphanedTemplates === 0) && (orphanedGenerations === 0);

  if (success) {
    console.log('\n✅ Migration verification PASSED');
  } else {
    console.log('\n❌ Migration verification FAILED');
  }

  return success;
}

/**
 * Main execution flow
 */
async function main() {
  console.log('═════════════════════════════════════════════════');
  console.log('🚀 MagFlow Migration: v1.0 → v2.0 (Multi-User SaaS)');
  console.log('═════════════════════════════════════════════════');

  try {
    // Step 1: Check current state
    const state = await checkCurrentState();

    if (!state.needsMigration) {
      console.log('\n⚠️  Database already appears to be migrated (profiles table exists)');
      console.log('Run verification to confirm migration status.');

      const verified = await verifyMigration();
      if (verified) {
        console.log('\n✅ Database is fully migrated and verified!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Database needs attention - check manually');
        process.exit(1);
      }
    }

    // Note: We'll execute SQL via the SQL Editor instead of RPC
    // because creating the exec_sql function requires SUPERUSER privileges

    console.log('\n⚠️  MANUAL STEPS REQUIRED:');
    console.log('─────────────────────────────────────────');
    console.log('This script cannot execute raw SQL directly.');
    console.log('Please follow these steps:\n');
    console.log('1. Open Supabase SQL Editor');
    console.log('2. Execute: backend/supabase-schema-v2.sql');
    console.log('3. Run this script again to create admin user');
    console.log('4. Execute: backend/migrations/001_add_multiuser.sql');
    console.log('   (with email replaced to alexandre.errasti@gmail.com)');
    console.log('─────────────────────────────────────────\n');

    // We can still create the admin user
    console.log('Creating admin user now...');
    const adminUserId = await createAdminUser();

    if (adminUserId) {
      console.log('\n✅ Admin user ready!');
      console.log('\nNext steps:');
      console.log('1. Execute supabase-schema-v2.sql in SQL Editor');
      console.log('2. Execute migrations/001_add_multiuser.sql in SQL Editor');
      console.log('   (email already set to alexandre.errasti@gmail.com)');
    }

  } catch (error) {
    console.error('\n❌ Migration failed with error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
main();
