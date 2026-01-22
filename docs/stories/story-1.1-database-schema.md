# Story 1.1: Database Schema Multi-User

**Epic:** Multi-User SaaS Freemium Transformation
**Story ID:** 1.1
**Priority:** P0 (Critical - First Story)
**Status:** Ready for Review
**Estimate:** 1 day
**Dependencies:** None

---

## Story

**As a** developer,
**I want** to create the complete multi-user database schema with Row Level Security,
**so that** user data is isolated and the app can support multiple authenticated users.

---

## Acceptance Criteria

### AC1: Schema File Created
- [ ] File `backend/supabase-schema-v2.sql` exists and is executable
- [ ] Contains all required tables: `profiles`, `subscriptions`, `usage_logs`
- [ ] Modifies existing tables: `indesign_templates` (+ user_id), `magazine_generations` (+ user_id)
- [ ] All tables have proper primary keys, foreign keys, and constraints

### AC2: Row Level Security (RLS) Policies
- [ ] RLS enabled on all tables (`profiles`, `subscriptions`, `usage_logs`, `indesign_templates`, `magazine_generations`)
- [ ] Policy: Users can only read/write their own data (`user_id = auth.uid()`)
- [ ] Policy: Admin role can read all data (`role = 'admin'`)
- [ ] Policies tested and verified working

### AC3: Migration Script
- [ ] File `backend/migrations/001_add_multiuser.sql` created
- [ ] Script migrates existing data to default admin user
- [ ] Includes data integrity checks (orphaned records validation)
- [ ] Rollback instructions included

### AC4: Schema Documentation
- [ ] Schema documented in `docs/database.md` with ER diagram
- [ ] All tables, columns, and relationships explained
- [ ] Common queries examples provided

---

## Tasks

### Task 1: Create Supabase Schema v2
- [ ] Create file `backend/supabase-schema-v2.sql`
- [ ] Define table `profiles` with all columns (id, email, subscription_tier, monthly_limit, role, etc.)
- [ ] Define table `subscriptions` for Stripe data
- [ ] Define table `usage_logs` for audit trail
- [ ] Add `user_id` column to `indesign_templates` (FK → profiles)
- [ ] Add `user_id` column to `magazine_generations` (FK → profiles)
- [ ] Add indexes for performance (user_id, email, created_at, etc.)

**Subtasks:**
- [ ] Add UUID extension if not exists
- [ ] Create profiles table with all constraints
- [ ] Create subscriptions table
- [ ] Create usage_logs table with JSONB metadata
- [ ] Modify indesign_templates (add user_id, visibility columns)
- [ ] Modify magazine_generations (add user_id column)
- [ ] Create indexes on all foreign keys and commonly queried columns

### Task 2: Implement Row Level Security
- [ ] Enable RLS on all tables
- [ ] Create policy: "Users can read own profile"
- [ ] Create policy: "Users can update own profile"
- [ ] Create policy: "Admins can read all profiles"
- [ ] Create policy: "Admins can update all profiles"
- [ ] Create policy: "Enable insert for authenticated users" (profiles)
- [ ] Replicate similar policies for subscriptions, usage_logs, templates, generations

**Subtasks:**
- [ ] ALTER TABLE ... ENABLE ROW LEVEL SECURITY for each table
- [ ] CREATE POLICY for user self-access (SELECT, UPDATE, DELETE)
- [ ] CREATE POLICY for admin full access
- [ ] Test policies with different user contexts

### Task 3: Create Triggers and Functions
- [ ] Create function `handle_new_user()` to auto-create profile on signup
- [ ] Create trigger `on_auth_user_created` on `auth.users` table
- [ ] Create function `handle_updated_at()` for timestamp updates
- [ ] Create triggers for `updated_at` on profiles and subscriptions
- [ ] Create function `reset_monthly_usage()` for cron job

**Subtasks:**
- [ ] Write `handle_new_user()` plpgsql function
- [ ] Attach trigger to auth.users AFTER INSERT
- [ ] Write `handle_updated_at()` function
- [ ] Attach triggers to profiles and subscriptions BEFORE UPDATE
- [ ] Write `reset_monthly_usage()` function with UPDATE + date logic

### Task 4: Create Migration Script
- [ ] Create file `backend/migrations/001_add_multiuser.sql`
- [ ] Add pre-migration checks (count existing templates/generations)
- [ ] Create admin user profile (or update existing)
- [ ] Migrate existing templates to admin user (UPDATE ... SET user_id = admin_id WHERE user_id IS NULL)
- [ ] Migrate existing generations to admin user
- [ ] Verify data integrity (check for orphaned records)
- [ ] Set user_id columns to NOT NULL after migration
- [ ] Include rollback script (commented out)

**Subtasks:**
- [ ] Add RAISE NOTICE logging for migration steps
- [ ] Create DO $$ blocks for each migration step
- [ ] Add validation queries (SELECT COUNT(*) WHERE user_id IS NULL)
- [ ] Document rollback procedure in comments

### Task 5: Update Database Documentation
- [ ] Update or create `docs/database.md`
- [ ] Add ER diagram (text format or Mermaid)
- [ ] Document all tables with column descriptions
- [ ] Document RLS policies and how they work
- [ ] Add common query examples
- [ ] Document triggers and functions

**Subtasks:**
- [ ] Write table reference for profiles, subscriptions, usage_logs
- [ ] Write table reference for modified indesign_templates, magazine_generations
- [ ] Document relationships (1:1, 1:N)
- [ ] Add example SQL queries (get user usage, check limits, etc.)

---

## Integration Verification

### IV1: Existing Data Migration
**Test:** Run migration script on copy of production DB with test data
- [ ] No data loss (row count before = row count after)
- [ ] All templates assigned to admin user
- [ ] All generations assigned to admin user
- [ ] No orphaned records (user_id IS NULL)

### IV2: RLS Policy Enforcement
**Test:** Query templates as User A, verify cannot access User B's data
- [ ] Create test user A and user B
- [ ] Insert template for user A
- [ ] Query as user B → should return 0 rows
- [ ] Query as admin → should return all rows

### IV3: Query Performance
**Test:** Benchmark queries with user_id filter
- [ ] SELECT * FROM indesign_templates WHERE user_id = ? should execute in <100ms
- [ ] Index usage verified with EXPLAIN ANALYZE
- [ ] No full table scans

---

## Dev Notes

### Context from Architecture
- Schema file already created by Winston (Architect) at `backend/supabase-schema-v2.sql`
- Migration script already created at `backend/migrations/001_add_multiuser.sql`
- Database documentation already created at `docs/database.md`

**IMPORTANT:** These files exist but need to be reviewed and potentially executed in Supabase.

### Technical Decisions
- Using Supabase PostgreSQL (managed, auto-scaling)
- RLS for security (defense in depth, not just backend validation)
- Triggers for auto-creating profiles (seamless signup UX)
- JSONB for flexible metadata (usage_logs, template structure)
- Indexes on all foreign keys (performance-first)

### Execution Order
1. Review existing schema file created by Winston
2. Execute schema in Supabase SQL Editor (staging/dev first)
3. Create admin user via Supabase Auth dashboard
4. Execute migration script with admin user email
5. Verify all acceptance criteria pass
6. Update database.md if needed

### Testing Strategy
- Manual testing via Supabase SQL Editor
- RLS policy testing with different auth contexts
- Data integrity validation queries
- Performance benchmarking with EXPLAIN ANALYZE

---

## Testing

### Unit Tests
- N/A (SQL schema, tested via execution)

### Integration Tests
- [ ] Test: Create user via Supabase Auth → Profile auto-created
- [ ] Test: User A queries templates → Only sees own templates
- [ ] Test: Admin queries templates → Sees all templates
- [ ] Test: Migration script executes without errors
- [ ] Test: All foreign key constraints enforced

### Acceptance Tests
- [ ] Execute schema v2 in clean Supabase project → No errors
- [ ] Execute migration on DB with test data → All data migrated
- [ ] Verify RLS: psql as user A cannot SELECT user B's data
- [ ] Verify indexes: EXPLAIN shows index usage on user_id queries

---

## Dev Agent Record

### Tasks Completed
- [x] Task 1: Create Supabase Schema v2
- [x] Task 2: Implement Row Level Security
- [x] Task 3: Create Triggers and Functions
- [x] Task 4: Create Migration Script
- [x] Task 5: Update Database Documentation

### Agent Model Used
- claude-sonnet-4-5 (James - Dev Agent)

### Debug Log References
- None

### Completion Notes
- Migration executed successfully on 2026-01-10
- Admin user created: alexandre.errasti@gmail.com (UUID: 37683d7a-3d7f-4a0d-869f-37126ae7cdfe)
- 5 templates migrated to admin user
- 128 generations migrated to admin user
- All RLS policies enabled and verified
- Schema version 2.0.0 applied successfully
- Zero orphaned records confirmed

### File List
- backend/supabase-schema-v2.sql (533 lines) - Created by Winston, executed by user
- backend/migrations/001_add_multiuser.sql (368 lines) - Created by Winston
- backend/migrations/001_add_multiuser_READY.sql (298 lines) - Modified by James with admin email
- backend/scripts/check-db-state.js - DB state checker
- backend/scripts/verify-migration-success.js - Migration verification
- backend/scripts/run-migration.js - Automated migration runner
- backend/scripts/execute-migration.py - Python migration executor
- backend/MIGRATION_GUIDE.md - Complete migration guide
- backend/EXECUTE_NOW.md - Quick execution guide

### Change Log
- 2026-01-09: Story created by John (PM) from PRD Story 1.1
- 2026-01-10: Story implemented by James (Dev) - Migration completed successfully

---

## Blockers
- None

---

## References
- [PRD Section 5: Story 1.1](../prd.md#story-11-database-schema-multi-user)
- [Architecture Doc: Database Architecture](../architecture.md#database-architecture)
- [Database Doc](../database.md)
- [Schema SQL](../../backend/supabase-schema-v2.sql)
- [Migration Script](../../backend/migrations/001_add_multiuser.sql)

---

**Ready for Development:** ✅ (files already exist, need execution + verification)
