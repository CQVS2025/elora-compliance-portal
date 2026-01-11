#!/bin/bash

# ELORA Fleet Compliance Portal - Direct Database Deployment
# Uses PostgreSQL connection string to deploy migrations directly

set -e

echo "🚀 ELORA Fleet Compliance Portal - Direct Deployment"
echo "===================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check for required tools
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL client (psql) not found${NC}"
    echo -e "${YELLOW}Installing postgresql-client...${NC}"
    apt-get update -qq && apt-get install -y -qq postgresql-client > /dev/null 2>&1 || {
        echo -e "${RED}❌ Failed to install postgresql-client${NC}"
        echo -e "${YELLOW}Please install manually: apt-get install postgresql-client${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ PostgreSQL client installed${NC}"
fi

# Construct database URL
PROJECT_REF="mtjfypwrtvzhnzgatoim"
DB_PASSWORD="your-db-password-here"  # This needs to be provided by user

echo -e "${BLUE}📋 Migrations to deploy:${NC}"
ls -1 supabase/migrations/*.sql | while read file; do
    echo "   - $(basename "$file")"
done
echo ""

echo -e "${YELLOW}⚠️  NOTE: Direct database deployment requires your database password${NC}"
echo -e "${YELLOW}Get it from: https://app.supabase.com/project/${PROJECT_REF}/settings/database${NC}"
echo ""

read -p "Enter your database password: " -s DB_PASSWORD
echo ""

# Construct connection string
DB_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

echo -e "${BLUE}🔗 Connecting to database...${NC}"

# Test connection
if psql "$DB_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected successfully${NC}"
else
    echo -e "${RED}❌ Connection failed${NC}"
    echo -e "${YELLOW}Please check your database password${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📤 Deploying migrations...${NC}"
echo ""

# Deploy each migration
for migration in supabase/migrations/*.sql; do
    filename=$(basename "$migration")
    echo -e "${BLUE}Executing: ${filename}${NC}"

    if psql "$DB_URL" -f "$migration" > /tmp/migration_output.log 2>&1; then
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
        echo -e "${YELLOW}Error output:${NC}"
        cat /tmp/migration_output.log
        exit 1
    fi
    echo ""
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 All migrations deployed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verify tables
echo -e "${BLUE}🔍 Verifying deployment...${NC}"
psql "$DB_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"

echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Visit: https://app.supabase.com/project/${PROJECT_REF}"
echo "2. Check tables in Table Editor"
echo "3. Verify RLS policies in Authentication > Policies"
echo "4. Create users in Authentication > Users"
echo ""
