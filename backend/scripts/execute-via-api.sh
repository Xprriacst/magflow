#!/bin/bash

# MagFlow Migration Executor via Supabase PostgREST API
# This script executes SQL via the Supabase REST API using service_role key

set -e

# Load environment variables
source "$(dirname "$0")/../.env"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
    exit 1
fi

SUPABASE_URL="${SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

echo "════════════════════════════════════════════════════════"
echo "🚀 MagFlow Migration: v1.0 → v2.0 (Multi-User SaaS)"
echo "════════════════════════════════════════════════════════"
echo ""

# Function to execute SQL via RPC
execute_sql() {
    local sql_content="$1"
    local description="$2"

    echo "────────────────────────────────────────────────────────"
    echo "📄 Executing: $description"
    echo "────────────────────────────────────────────────────────"
    echo ""

    # Escape SQL for JSON
    local escaped_sql=$(echo "$sql_content" | jq -Rs .)

    # Call Supabase RPC endpoint
    response=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SERVICE_KEY}" \
        -H "Authorization: Bearer ${SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"sql_query\": ${escaped_sql}}")

    echo "$response"

    if echo "$response" | grep -q "error"; then
        echo ""
        echo "❌ Error executing: $description"
        echo "Response: $response"
        return 1
    else
        echo ""
        echo "✅ $description completed successfully!"
        return 0
    fi
}

# Step 1: Create exec_sql function (if not exists)
echo "STEP 0: Creating SQL execution function..."
echo ""

exec_sql_function="
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS \$\$
BEGIN
    EXECUTE sql_query;
    RETURN 'Success';
EXCEPTION WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
\$\$;
"

# We can't create this via REST API easily, user needs to do it manually
echo "⚠️  This script requires the exec_sql() function to exist in your database."
echo ""
echo "Please run this SQL in Supabase SQL Editor first:"
echo "────────────────────────────────────────────────────────"
echo "$exec_sql_function"
echo "────────────────────────────────────────────────────────"
echo ""
read -p "Have you executed the exec_sql function? (y/n): " response

if [ "$response" != "y" ]; then
    echo "❌ Please execute the exec_sql function first, then run this script again."
    exit 1
fi

# Step 2: Execute Schema v2
echo ""
echo "════════════════════════════════════════════════════════"
echo "STEP 1: Executing Schema v2"
echo "════════════════════════════════════════════════════════"
echo ""

schema_v2=$(cat "$(dirname "$0")/../supabase-schema-v2.sql")
execute_sql "$schema_v2" "Schema v2 (Create Tables + RLS)" || exit 1

# Step 3: Execute Migration
echo ""
echo "════════════════════════════════════════════════════════"
echo "STEP 2: Executing Migration Script"
echo "════════════════════════════════════════════════════════"
echo ""

migration=$(cat "$(dirname "$0")/../migrations/001_add_multiuser_READY.sql")
execute_sql "$migration" "Migration 001 (Migrate Data)" || exit 1

# Step 4: Summary
echo ""
echo "════════════════════════════════════════════════════════"
echo "🎉 MIGRATION COMPLETE!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Next Steps:"
echo "  1. Test login with: alexandre.errasti@gmail.com"
echo "  2. Create a test user via signup"
echo "  3. Verify RLS policies are working"
echo "  4. Continue to Story 1.2 (Backend Auth Middleware)"
echo ""
