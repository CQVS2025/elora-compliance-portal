#!/bin/bash

# ELORA Fleet Compliance Portal - Direct SQL Deployment to Supabase
# Deploys migrations directly via Supabase REST API
# No CLI authentication required

set -e

echo "🚀 ELORA Fleet Compliance Portal - Direct SQL Deployment"
echo "========================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment variables
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local not found${NC}"
    exit 1
fi

source .env.local

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY not set in .env.local${NC}"
    exit 1
fi

if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_URL not set in .env.local${NC}"
    exit 1
fi

echo -e "${BLUE}Project URL: ${VITE_SUPABASE_URL}${NC}"
echo ""

# Function to execute SQL via Supabase REST API
execute_sql() {
    local sql_file=$1
    local filename=$(basename "$sql_file")

    echo -e "${BLUE}📤 Executing: ${filename}${NC}"

    # Read SQL file
    local sql_content=$(cat "$sql_file")

    # Execute via REST API
    local response=$(curl -s -w "\n%{http_code}" \
        "${VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"query\":$(echo "$sql_content" | jq -Rs .)}" 2>&1)

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ Success${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Using alternative method...${NC}"

        # Alternative: Direct database connection
        # This would require psql or another PostgreSQL client
        echo -e "${YELLOW}Note: For direct deployment, use the Supabase dashboard SQL Editor${NC}"
        echo -e "${YELLOW}or the Supabase CLI with: supabase db push${NC}"
        return 1
    fi
}

echo -e "${BLUE}📋 Migrations found:${NC}"
for migration in supabase/migrations/*.sql; do
    echo "   - $(basename "$migration")"
done
echo ""

echo -e "${YELLOW}⚠️  DEPLOYMENT METHOD:${NC}"
echo "This script will show you how to deploy the migrations."
echo "For production deployment, please use ONE of these methods:"
echo ""
echo "METHOD 1 - Supabase CLI (Recommended):"
echo "  1. Login: supabase login"
echo "  2. Link: supabase link --project-ref mtjfypwrtvzhnzgatoim"
echo "  3. Push: supabase db push"
echo ""
echo "METHOD 2 - Supabase Dashboard SQL Editor:"
echo "  1. Go to: https://app.supabase.com/project/mtjfypwrtvzhnzgatoim/sql/new"
echo "  2. Copy and paste each migration file in order:"
echo "     - 20250112000001_initial_schema.sql"
echo "     - 20250112000002_rls_policies.sql"
echo "     - 20250112000003_seed_test_data.sql"
echo "  3. Click 'Run' for each migration"
echo ""
echo "METHOD 3 - PostgreSQL Client:"
echo "  1. Get connection string from Supabase dashboard"
echo "  2. Use psql to execute migrations"
echo ""

read -p "Would you like me to show the SQL for manual deployment? (yes/no): " show_sql

if [ "$show_sql" = "yes" ]; then
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}MIGRATION 1: Initial Schema${NC}"
    echo -e "${BLUE}========================================${NC}"
    cat supabase/migrations/20250112000001_initial_schema.sql
    echo ""

    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}MIGRATION 2: RLS Policies${NC}"
    echo -e "${BLUE}========================================${NC}"
    cat supabase/migrations/20250112000002_rls_policies.sql
    echo ""

    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}MIGRATION 3: Seed Data${NC}"
    echo -e "${BLUE}========================================${NC}"
    cat supabase/migrations/20250112000003_seed_test_data.sql
    echo ""
fi

echo -e "${GREEN}Next steps:${NC}"
echo "1. Choose one of the deployment methods above"
echo "2. Execute all 3 migrations in order"
echo "3. Verify tables in Supabase dashboard"
echo "4. Create test users via Authentication tab"
echo ""
