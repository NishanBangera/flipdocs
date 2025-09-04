#!/bin/bash

# FlipDocs Deployment Readiness Checker
# This script validates your setup before deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

echo -e "${GREEN}🔍 FlipDocs Deployment Readiness Check${NC}\n"

# Counter for errors
ERROR_COUNT=0

# Check 1: GitHub repository structure
print_header "GitHub Repository Structure"

if [ -f ".github/workflows/build-and-deploy.yml" ]; then
    print_success "GitHub Actions workflow exists"
else
    print_error "GitHub Actions workflow not found"
    ((ERROR_COUNT++))
fi

if [ -f "docker-compose.registry.yml" ]; then
    print_success "Registry Docker Compose file exists"
else
    print_error "Registry Docker Compose file not found"
    ((ERROR_COUNT++))
fi

if [ -f "scripts/deploy-from-registry.sh" ]; then
    print_success "Registry deployment script exists"
    if [ -x "scripts/deploy-from-registry.sh" ]; then
        print_success "Deployment script is executable"
    else
        print_warning "Deployment script needs execute permissions"
        chmod +x scripts/deploy-from-registry.sh
        print_success "Fixed deployment script permissions"
    fi
else
    print_error "Registry deployment script not found"
    ((ERROR_COUNT++))
fi

# Check 2: Docker configuration
print_header "Docker Configuration"

if [ -f "apps/api/Dockerfile" ]; then
    print_success "API Dockerfile exists"
    
    # Check if Dockerfile has health check
    if grep -q "HEALTHCHECK" apps/api/Dockerfile; then
        print_success "API Dockerfile has health check configured"
    else
        print_warning "API Dockerfile missing health check"
    fi
    
    # Check if curl is installed for health checks
    if grep -q "curl" apps/api/Dockerfile; then
        print_success "API Dockerfile has curl for health checks"
    else
        print_warning "API Dockerfile missing curl for health checks"
    fi
else
    print_error "API Dockerfile not found"
    ((ERROR_COUNT++))
fi

if [ -f "apps/web/Dockerfile" ]; then
    print_success "Web Dockerfile exists"
    
    # Check if Dockerfile has health check
    if grep -q "HEALTHCHECK" apps/web/Dockerfile; then
        print_success "Web Dockerfile has health check configured"
    else
        print_warning "Web Dockerfile missing health check"
    fi
    
    # Check if curl is installed for health checks
    if grep -q "curl" apps/web/Dockerfile; then
        print_success "Web Dockerfile has curl for health checks"
    else
        print_warning "Web Dockerfile missing curl for health checks"
    fi
else
    print_error "Web Dockerfile not found"
    ((ERROR_COUNT++))
fi

# Check 3: Next.js configuration
print_header "Next.js Configuration"

if [ -f "apps/web/next.config.ts" ]; then
    if grep -q "output.*standalone" apps/web/next.config.ts; then
        print_success "Next.js configured for standalone output"
    else
        print_error "Next.js not configured for standalone output"
        ((ERROR_COUNT++))
    fi
else
    print_error "Next.js config file not found"
    ((ERROR_COUNT++))
fi

# Check 4: API configuration
print_header "API Configuration"

if [ -f "apps/api/src/index.ts" ]; then
    if grep -q "hostname.*0\.0\.0\.0" apps/api/src/index.ts; then
        print_success "API configured to bind to 0.0.0.0"
    else
        print_error "API not configured to bind to 0.0.0.0 (required for Docker)"
        ((ERROR_COUNT++))
    fi
    
    if grep -q "/health" apps/api/src/index.ts; then
        print_success "API has health endpoint"
    else
        print_error "API missing health endpoint"
        ((ERROR_COUNT++))
    fi
else
    print_error "API index file not found"
    ((ERROR_COUNT++))
fi

# Check 5: Health endpoints
print_header "Health Endpoints"

if [ -f "apps/web/app/api/health/route.ts" ]; then
    print_success "Web health endpoint exists"
else
    print_error "Web health endpoint not found"
    ((ERROR_COUNT++))
fi

# Check 6: Package.json configuration
print_header "Package Configuration"

if [ -f "apps/api/package.json" ]; then
    if grep -q "@flipdocs/api" apps/api/package.json; then
        print_success "API package name is correct"
    else
        print_warning "API package name might need adjustment for Turbo"
    fi
else
    print_error "API package.json not found"
    ((ERROR_COUNT++))
fi

if [ -f "apps/web/package.json" ]; then
    if grep -q "@flipdocs/web" apps/web/package.json; then
        print_success "Web package name is correct"
    else
        print_warning "Web package name might need adjustment for Turbo"
    fi
else
    print_error "Web package.json not found"
    ((ERROR_COUNT++))
fi

# Check 7: Nginx configuration
print_header "Nginx Configuration"

if [ -f "docker/nginx/prod-http.conf" ]; then
    print_success "Nginx production configuration exists"
    
    if grep -q "upstream.*api.*3001" docker/nginx/prod-http.conf; then
        print_success "Nginx configured for API on port 3001"
    else
        print_warning "Check Nginx API upstream configuration"
    fi
    
    if grep -q "upstream.*web.*3000" docker/nginx/prod-http.conf; then
        print_success "Nginx configured for Web on port 3000"
    else
        print_warning "Check Nginx Web upstream configuration"
    fi
else
    print_error "Nginx production configuration not found"
    ((ERROR_COUNT++))
fi

# Check 8: Environment template
print_header "Environment Configuration"

if [ -f ".env.production.template" ]; then
    print_success "Environment template exists"
else
    print_warning "Environment template not found - creating one"
    cat > .env.production.template << 'EOF'
# FlipDocs Production Environment Configuration
NODE_ENV=production

# API Configuration
PORT=3001
API_URL=http://localhost:3001

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/flipdocs

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Storage Configuration
STORAGE_PROVIDER=supabase
SUPABASE_STORAGE_BUCKET=flipbooks

# Application Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
EOF
    print_success "Created environment template"
fi

# Check 9: Build capability
print_header "Build Configuration"

if command -v bun > /dev/null 2>&1; then
    print_success "Bun is available for builds"
else
    print_warning "Bun not found locally (OK if building in Docker)"
fi

if command -v turbo > /dev/null 2>&1; then
    print_success "Turbo is available for builds"
elif [ -f "node_modules/.bin/turbo" ]; then
    print_success "Turbo is available locally"
else
    print_warning "Turbo not found (install with: npm install turbo)"
fi

# Check 10: Git repository
print_header "Git Repository"

if git rev-parse --git-dir > /dev/null 2>&1; then
    print_success "Git repository initialized"
    
    if git remote get-url origin > /dev/null 2>&1; then
        ORIGIN_URL=$(git remote get-url origin)
        print_success "Git remote origin configured: $ORIGIN_URL"
        
        if [[ $ORIGIN_URL == *"github.com"* ]]; then
            print_success "Repository is on GitHub"
        else
            print_warning "Repository is not on GitHub - GitHub Actions won't work"
        fi
    else
        print_warning "Git remote origin not configured"
    fi
else
    print_error "Not a Git repository"
    ((ERROR_COUNT++))
fi

# Final summary
print_header "Summary"

if [ $ERROR_COUNT -eq 0 ]; then
    print_success "🎉 Your FlipDocs project is ready for deployment!"
    echo
    print_info "Next steps:"
    echo "1. Set up GitHub repository secrets (EC2_HOST, EC2_USER, EC2_SSH_KEY)"
    echo "2. Configure your EC2 instance with scripts/setup-ec2.sh"
    echo "3. Update .env.production with your actual configuration"
    echo "4. Push to main branch to trigger deployment"
    echo
    print_info "Manual deployment: ./scripts/deploy-from-registry.sh"
else
    print_error "Found $ERROR_COUNT critical issues that need to be fixed before deployment"
    echo
    print_info "Please fix the issues above and run this check again"
fi

echo
print_info "For detailed deployment instructions, see:"
echo "  - GHCR-DEPLOYMENT-GUIDE.md (comprehensive guide)"
echo "  - QUICK-DEPLOY.md (quick start guide)"