/**
 * Verify Migration Success
 * Checks that all tables, columns, and RLS policies are properly configured
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verifyMigration() {
  console.log('═══════════════════════════════════════');
  console.log('✅ Verifying Migration Success');
  console.log('═══════════════════════════════════════\n');

  let allChecks = true;

  // Check 1: Profiles table and admin user
  console.log('📋 Check 1: Admin Profile');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'alexandre.errasti@gmail.com');

  if (profilesError) {
    console.log('❌ Error querying profiles:', profilesError.message);
    allChecks = false;
  } else if (!profiles || profiles.length === 0) {
    console.log('❌ Admin profile not found');
    allChecks = false;
  } else {
    const admin = profiles[0];
    console.log('✅ Admin profile found:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Tier: ${admin.subscription_tier}`);
    console.log(`   Monthly limit: ${admin.monthly_limit}`);
  }

  // Check 2: Templates have user_id
  console.log('\n📋 Check 2: Templates Migration');
  const { count: totalTemplates } = await supabase
    .from('indesign_templates')
    .select('*', { count: 'exact', head: true });

  const { count: orphanedTemplates } = await supabase
    .from('indesign_templates')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null);

  console.log(`✅ Total templates: ${totalTemplates}`);
  if (orphanedTemplates === 0) {
    console.log(`✅ Orphaned templates: 0 (all migrated)`);
  } else {
    console.log(`❌ Orphaned templates: ${orphanedTemplates} (migration incomplete)`);
    allChecks = false;
  }

  // Check 3: Generations have user_id
  console.log('\n📋 Check 3: Generations Migration');
  const { count: totalGenerations } = await supabase
    .from('magazine_generations')
    .select('*', { count: 'exact', head: true });

  const { count: orphanedGenerations } = await supabase
    .from('magazine_generations')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null);

  console.log(`✅ Total generations: ${totalGenerations}`);
  if (orphanedGenerations === 0) {
    console.log(`✅ Orphaned generations: 0 (all migrated)`);
  } else {
    console.log(`❌ Orphaned generations: ${orphanedGenerations} (migration incomplete)`);
    allChecks = false;
  }

  // Check 4: New tables exist
  console.log('\n📋 Check 4: New Tables');
  const tables = ['profiles', 'subscriptions', 'usage_logs'];
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error && error.code === 'PGRST116') {
      console.log(`❌ Table ${table} does not exist`);
      allChecks = false;
    } else {
      console.log(`✅ Table ${table} exists`);
    }
  }

  // Check 5: Schema version
  console.log('\n📋 Check 5: Schema Version');
  const { data: schemaVersion } = await supabase
    .from('schema_version')
    .select('*')
    .eq('version', '2.0.0');

  if (schemaVersion && schemaVersion.length > 0) {
    console.log(`✅ Schema version: 2.0.0`);
    console.log(`   Applied at: ${schemaVersion[0].applied_at}`);
  } else {
    console.log(`❌ Schema version 2.0.0 not found`);
    allChecks = false;
  }

  // Summary
  console.log('\n═══════════════════════════════════════');
  if (allChecks) {
    console.log('🎉 MIGRATION SUCCESSFUL!');
    console.log('═══════════════════════════════════════');
    console.log('\n✅ All checks passed');
    console.log('✅ Database migrated to v2.0 (Multi-User SaaS)');
    console.log('\n📝 Next Steps:');
    console.log('   1. Story 1.1 is complete ✓');
    console.log('   2. Continue to Story 1.2: Backend Auth Middleware');
    console.log('   3. Continue to Story 1.3: Usage Tracking & Limits');
  } else {
    console.log('⚠️  MIGRATION INCOMPLETE');
    console.log('═══════════════════════════════════════');
    console.log('\n❌ Some checks failed - review output above');
  }
  console.log('');
}

verifyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  });
