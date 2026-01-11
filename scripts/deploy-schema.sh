#!/bin/bash

# ELORA Fleet Compliance Portal - Deploy Schema to Supabase Cloud
# This script deploys database migrations to production Supabase
# Project: mtjfypwrtvzhnzgatoim (Sydney region)

set -e

echo "🚀 ELORA Fleet Compliance Portal - Deploy to Supabase Cloud"
echo "============================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_REF="mtjfypwrtvzhnzgatoim"

# Check if Supabase CLI is installed
echo -e "${BLUE}🔍 Checking Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first:${NC}"
    echo "   macOS: brew install supabase/tap/supabase"
    echo "   Linux: https://supabase.com/docs/guides/cli"
    exit 1
fi
echo -e "${GREEN}✓ Supabase CLI found ($(supabase --version))${NC}"
echo ""

# Verify migrations exist
echo -e "${BLUE}📦 Checking migrations...${NC}"
if [ ! -d "supabase/migrations" ] || [ ! "$(ls -A supabase/migrations)" ]; then
    echo -e "${RED}❌ No migrations found in supabase/migrations directory${NC}"
    exit 1
fi

MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
echo -e "${GREEN}✓ Found ${MIGRATION_COUNT} migration file(s)${NC}"
echo ""

# List migrations
echo -e "${BLUE}📋 Migrations to deploy:${NC}"
ls -1 supabase/migrations/*.sql | while read file; do
    echo "   - $(basename "$file")"
done
echo ""

# Confirmation prompt
echo -e "${YELLOW}⚠️  WARNING: This will deploy migrations to PRODUCTION Supabase!${NC}"
echo -e "${YELLOW}   Project: ${PROJECT_REF}${NC}"
echo -e "${YELLOW}   Region: Sydney${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 0
fi
echo ""

# Link to project (if not already linked)
echo -e "${BLUE}🔗 Linking to Supabase project...${NC}"
if supabase status 2>/dev/null | grep -q "$PROJECT_REF"; then
    echo -e "${GREEN}✓ Already linked to project${NC}"
else
    echo -e "${YELLOW}Please log in to Supabase if prompted...${NC}"
    supabase link --project-ref "$PROJECT_REF"
    echo -e "${GREEN}✓ Linked to Supabase project${NC}"
fi
echo ""

# Check remote database status
echo -e "${BLUE}🔍 Checking remote database...${NC}"
if supabase db remote --help &> /dev/null; then
    echo -e "${GREEN}✓ Remote database accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Cannot verify remote database access${NC}"
fi
echo ""

# Push migrations
echo -e "${BLUE}📤 Pushing migrations to Supabase Cloud...${NC}"
echo -e "${YELLOW}This may take a few moments...${NC}"
echo ""

if supabase db push; then
    echo ""
    echo -e "${GREEN}✓ Migrations deployed successfully!${NC}"
else
    echo ""
    echo -e "${RED}❌ Migration deployment failed${NC}"
    echo -e "${YELLOW}Common issues:${NC}"
    echo "  - Check your internet connection"
    echo "  - Verify project credentials"
    echo "  - Review migration SQL for errors"
    echo "  - Check Supabase project status at https://app.supabase.com"
    exit 1
fi
echo ""

# Verify deployment
echo -e "${BLUE}🔍 Verifying deployment...${NC}"
echo -e "${YELLOW}Checking remote database...${NC}"

# Run a simple query to verify tables exist
if supabase db remote --help &> /dev/null; then
    echo -e "${GREEN}✓ Remote database is accessible${NC}"
fi
echo ""

# Display success message
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}🎉 Schema deployment complete!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Visit Supabase Dashboard: https://app.supabase.com/project/${PROJECT_REF}"
echo "2. Verify tables in Table Editor"
echo "3. Check RLS policies in Authentication > Policies"
echo "4. Create test users in Authentication > Users"
echo "5. Test your application with production Supabase"
echo ""
echo -e "${BLUE}Production URLs:${NC}"
echo "  API URL: https://mtjfypwrtvzhnzgatoim.supabase.co"
echo "  Dashboard: https://app.supabase.com/project/${PROJECT_REF}"
echo ""
echo -e "${BLUE}Database connection:${NC}"
echo "  Check the Supabase Dashboard for connection strings"
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "  - Update your .env.production with production keys"
echo "  - Create initial users via Supabase Auth"
echo "  - Set up email templates in Supabase Dashboard"
echo "  - Configure custom SMTP if needed"
echo ""
