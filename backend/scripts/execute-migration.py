#!/usr/bin/env python3
"""
Automated Migration Executor using PostgreSQL Direct Connection
Executes schema v2 and migration scripts directly via psycopg2
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from pathlib import Path

# Connection details
SUPABASE_HOST = "db.wxtrhxvyjfsqgphboqwo.supabase.co"
SUPABASE_PORT = "5432"
SUPABASE_DB = "postgres"
SUPABASE_USER = "postgres"
SUPABASE_PASSWORD = input("Enter Supabase PostgreSQL password (from Settings → Database → Connection string): ")

# File paths
SCRIPT_DIR = Path(__file__).parent
BACKEND_DIR = SCRIPT_DIR.parent
SCHEMA_FILE = BACKEND_DIR / "supabase-schema-v2.sql"
MIGRATION_FILE = BACKEND_DIR / "migrations" / "001_add_multiuser_READY.sql"

def connect_db():
    """Connect to Supabase PostgreSQL database"""
    print("🔌 Connecting to Supabase PostgreSQL...")
    try:
        conn = psycopg2.connect(
            host=SUPABASE_HOST,
            port=SUPABASE_PORT,
            database=SUPABASE_DB,
            user=SUPABASE_USER,
            password=SUPABASE_PASSWORD,
            connect_timeout=10
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        print("✅ Connected successfully!")
        return conn
    except psycopg2.Error as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

def execute_sql_file(conn, filepath, description):
    """Execute a SQL file"""
    print(f"\n{'='*60}")
    print(f"📄 Executing: {description}")
    print(f"{'='*60}\n")

    if not filepath.exists():
        print(f"❌ File not found: {filepath}")
        return False

    # Read SQL file
    with open(filepath, 'r', encoding='utf-8') as f:
        sql = f.read()

    # Execute SQL
    cursor = conn.cursor()
    try:
        # Enable notices to see RAISE NOTICE output
        cursor.execute("SET client_min_messages TO NOTICE;")

        print(f"🔄 Executing SQL ({filepath.name})...")
        cursor.execute(sql)

        # Get all notices/messages
        for notice in conn.notices:
            print(notice.strip())

        # Clear notices for next execution
        conn.notices.clear()

        print(f"\n✅ {description} completed successfully!")
        return True

    except psycopg2.Error as e:
        print(f"\n❌ Error executing {description}:")
        print(f"   {e}")
        return False
    finally:
        cursor.close()

def check_current_state(conn):
    """Check current database state"""
    print("\n" + "="*60)
    print("📊 Checking Current Database State")
    print("="*60 + "\n")

    cursor = conn.cursor()

    # Check if profiles table exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'profiles'
        );
    """)
    profiles_exists = cursor.fetchone()[0]

    # Check templates count
    cursor.execute("SELECT COUNT(*) FROM public.indesign_templates;")
    templates_count = cursor.fetchone()[0]

    # Check generations count
    cursor.execute("SELECT COUNT(*) FROM public.magazine_generations;")
    generations_count = cursor.fetchone()[0]

    print(f"Current State:")
    print(f"  profiles table: {'✅ EXISTS' if profiles_exists else '❌ MISSING'}")
    print(f"  Templates: {templates_count}")
    print(f"  Generations: {generations_count}")

    cursor.close()

    return {
        'profiles_exists': profiles_exists,
        'templates_count': templates_count,
        'generations_count': generations_count
    }

def verify_migration(conn):
    """Verify migration completed successfully"""
    print("\n" + "="*60)
    print("✅ Verifying Migration Success")
    print("="*60 + "\n")

    cursor = conn.cursor()

    try:
        # Check profiles
        cursor.execute("SELECT COUNT(*) FROM public.profiles;")
        profiles_count = cursor.fetchone()[0]

        # Check orphaned templates
        cursor.execute("SELECT COUNT(*) FROM public.indesign_templates WHERE user_id IS NULL;")
        orphaned_templates = cursor.fetchone()[0]

        # Check orphaned generations
        cursor.execute("SELECT COUNT(*) FROM public.magazine_generations WHERE user_id IS NULL;")
        orphaned_generations = cursor.fetchone()[0]

        # Check RLS status
        cursor.execute("""
            SELECT tablename, rowsecurity
            FROM pg_tables
            WHERE schemaname = 'public'
              AND tablename IN ('profiles', 'indesign_templates', 'magazine_generations')
            ORDER BY tablename;
        """)
        rls_status = cursor.fetchall()

        print("Verification Results:")
        print(f"  Profiles created: {profiles_count}")
        print(f"  Orphaned templates: {orphaned_templates}")
        print(f"  Orphaned generations: {orphaned_generations}")
        print(f"\n  RLS Status:")
        for table, rls_enabled in rls_status:
            print(f"    {table}: {'✅ ENABLED' if rls_enabled else '❌ DISABLED'}")

        # Success criteria
        success = (
            profiles_count > 0 and
            orphaned_templates == 0 and
            orphaned_generations == 0 and
            all(rls for _, rls in rls_status)
        )

        if success:
            print("\n✅ Migration verification PASSED!")
            print("\nDatabase successfully migrated to v2.0 (Multi-User SaaS)")
        else:
            print("\n⚠️  Migration verification FAILED - check results above")

        cursor.close()
        return success

    except psycopg2.Error as e:
        print(f"❌ Verification error: {e}")
        cursor.close()
        return False

def main():
    """Main execution flow"""
    print("="*60)
    print("🚀 MagFlow Migration: v1.0 → v2.0 (Multi-User SaaS)")
    print("="*60)

    # Connect to database
    conn = connect_db()

    try:
        # Step 1: Check current state
        state = check_current_state(conn)

        if state['profiles_exists']:
            print("\n⚠️  Profiles table already exists - migration may have been run before")
            user_input = input("Continue anyway? (y/n): ")
            if user_input.lower() != 'y':
                print("Migration cancelled.")
                return

        # Step 2: Execute schema v2
        print("\n" + "="*60)
        print("STEP 1: Executing Schema v2")
        print("="*60)

        if not execute_sql_file(conn, SCHEMA_FILE, "Schema v2 (Create Tables + RLS)"):
            print("\n❌ Schema v2 execution failed. Stopping.")
            return

        # Step 3: Execute migration
        print("\n" + "="*60)
        print("STEP 2: Executing Migration Script")
        print("="*60)

        if not execute_sql_file(conn, MIGRATION_FILE, "Migration 001 (Migrate Data)"):
            print("\n❌ Migration execution failed. Stopping.")
            return

        # Step 4: Verify
        verify_migration(conn)

        print("\n" + "="*60)
        print("🎉 MIGRATION COMPLETE!")
        print("="*60)
        print("\nNext Steps:")
        print("  1. Test login with: alexandre.errasti@gmail.com")
        print("  2. Create a test user via signup")
        print("  3. Verify RLS policies are working")
        print("  4. Continue to Story 1.2 (Backend Auth Middleware)")

    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()
        print("\n🔌 Database connection closed")

if __name__ == "__main__":
    main()
