#!/bin/bash

# ELORA Fleet Compliance Portal - Local Supabase Setup
# This script sets up Supabase for local development
# Prerequisites: Docker Desktop installed and running

set -e

echo "🚀 ELORA Fleet Compliance Portal - Local Supabase Setup"
echo "========================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${BLUE}📦 Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Check if Supabase CLI is installed
echo -e "${BLUE}🔍 Checking Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"

    # Detect OS and install
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install supabase/tap/supabase
        else
            echo -e "${RED}❌ Homebrew not found. Please install Homebrew first: https://brew.sh${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
        sudo mv supabase /usr/local/bin/
    else
        echo -e "${RED}❌ Unsupported OS. Please install Supabase CLI manually: https://supabase.com/docs/guides/cli${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Supabase CLI installed${NC}"
else
    echo -e "${GREEN}✓ Supabase CLI found ($(supabase --version))${NC}"
fi
echo ""

# Initialize Supabase
echo -e "${BLUE}🔧 Initializing Supabase...${NC}"
if [ -f "supabase/.gitignore" ]; then
    echo -e "${YELLOW}⚠️  Supabase already initialized. Skipping...${NC}"
else
    supabase init
    echo -e "${GREEN}✓ Supabase initialized${NC}"
fi
echo ""

# Link to remote project
echo -e "${BLUE}🔗 Linking to Supabase project (mtjfypwrtvzhnzgatoim)...${NC}"
echo -e "${YELLOW}You may be prompted to log in to Supabase.${NC}"

# Check if already linked
if supabase status 2>/dev/null | grep -q "mtjfypwrtvzhnzgatoim"; then
    echo -e "${GREEN}✓ Already linked to project${NC}"
else
    supabase link --project-ref mtjfypwrtvzhnzgatoim
    echo -e "${GREEN}✓ Linked to Supabase project${NC}"
fi
echo ""

# Start local Supabase
echo -e "${BLUE}🎬 Starting local Supabase instance...${NC}"
echo -e "${YELLOW}This may take a few minutes on first run (downloading Docker images)...${NC}"
supabase start

echo ""
echo -e "${GREEN}✓ Local Supabase is running!${NC}"
echo ""

# Display connection info
echo -e "${BLUE}📋 Local Connection Info:${NC}"
supabase status
echo ""

# Apply migrations to local database
echo -e "${BLUE}📦 Applying database migrations...${NC}"
if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations)" ]; then
    supabase db reset
    echo -e "${GREEN}✓ Migrations applied successfully${NC}"
else
    echo -e "${YELLOW}⚠️  No migrations found in supabase/migrations${NC}"
fi
echo ""

# Display next steps
echo -e "${GREEN}=========================================================${NC}"
echo -e "${GREEN}🎉 Local Supabase setup complete!${NC}"
echo -e "${GREEN}=========================================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Visit the Supabase Studio: http://localhost:54323"
echo "2. Check your database tables and data"
echo "3. Start your development server: npm run dev"
echo "4. Your app will connect to local Supabase automatically"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  supabase status      - Check local Supabase status"
echo "  supabase stop        - Stop local Supabase"
echo "  supabase db reset    - Reset local database and re-run migrations"
echo "  supabase db push     - Push migrations to remote (production)"
echo ""
echo -e "${YELLOW}⚠️  Note: Local Supabase uses different credentials than production.${NC}"
echo -e "${YELLOW}   Check 'supabase status' for local API URLs and keys.${NC}"
echo ""
