 

## 📋 Prerequisites

- AWS EC2 instance (Ubuntu 20.04+ recommended)
- Domain name pointing to your EC2 instance
- Basic knowledge of Docker and Linux commands

## 🚀 Quick Start

### 1. Prepare AWS EC2 Instance

```bash
# Run the setup script on your EC2 instance
chmod +x scripts/setup-aws.sh
./scripts/setup-aws.sh

# Reboot the instance
sudo reboot
```

### 2. Clone and Setup Repository

```bash
# Clone the repository
cd /opt
sudo git clone https://github.com/your-username/flipdocs.git
sudo chown -R $USER:$USER flipdocs
cd flipdocs

# Make scripts executable
chmod +x scripts/*.sh
```

### 3. Configure Environment

```bash
# Copy and configure production environment
cp .env.production.example .env.production
nano .env.production  # Edit with your actual values
```

### 4. Setup SSL Certificates

```bash
# Replace with your domain and email
./scripts/setup-ssl.sh your-domain.com admin@your-domain.com
```

### 5. Deploy Application

```bash
# Deploy to production
./scripts/deploy.sh
```

## 🏗️ Architecture Overview

### Services

- **Web Service**: Next.js frontend application
- **API Service**: ElysiaJS backend with Bun runtime
- **Nginx**: Reverse proxy and load balancer
- **Monitoring**: Optional Prometheus and Grafana

### Network

- **Port 80**: HTTP (redirects to HTTPS)
- **Port 443**: HTTPS
- **Internal**: Services communicate via Docker network

## 📁 File Structure

```
flipdocs/
├── apps/
│   ├── web/
│   │   ├── Dockerfile              # Next.js multi-stage build
│   │   └── .dockerignore
│   └── api/
│       ├── Dockerfile              # ElysiaJS with Bun
│       └── .dockerignore
├── docker/
│   └── nginx/
│       ├── dev.conf                # Development config
│       ├── prod.conf               # Production config
│       └── ssl/                    # SSL certificates
├── scripts/
│   ├── deploy.sh                   # Main deployment script
│   ├── setup-aws.sh               # EC2 setup script
│   └── setup-ssl.sh               # SSL setup script
├── docker-compose.yml             # Development
├── docker-compose.prod.yml        # Production
├── .env.production.example         # Environment template
└── .dockerignore                   # Global Docker ignore
```

## 🛠️ Development

### Local Development

```bash
# Start all services for development
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services Access

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Nginx Proxy**: http://localhost:80
- **Redis**: localhost:6379
- **Database**: Supabase (hosted)

## 🚀 Production Deployment

### Environment Variables

Key environment variables in `.env.production`:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_DOMAIN=https://your-domain.com

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Authentication
CLERK_SECRET_KEY=sk_live_your_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key

# AWS (if using AWS services)
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket
```

### Deployment Commands

```bash
# Full deployment
./scripts/deploy.sh

# View logs
./scripts/deploy.sh logs

# Check status
./scripts/deploy.sh status

# Restart services
./scripts/deploy.sh restart

# Health check
./scripts/deploy.sh health

# Stop all services
./scripts/deploy.sh stop
```

### Monitoring and Logging

```bash
# Enable monitoring stack
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# View service logs
docker-compose -f docker-compose.prod.yml logs -f web

# Check resource usage
docker stats

# Nginx access logs
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log
```

## 🔒 Security Configuration

### SSL/TLS Setup

Automatically configured with Let's Encrypt:

```bash
# Setup SSL for your domain
./scripts/setup-ssl.sh your-domain.com admin@your-domain.com

# Manual certificate renewal (automatic via cron)
sudo certbot renew
```

### Security Headers

Nginx is configured with security headers:
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content Security Policy

### Rate Limiting

- API endpoints: 50 requests/second
- Web endpoints: 100 requests/second
- Login endpoints: 5 requests/minute

## 📊 Monitoring and Health Checks

### Health Endpoints

- **Application**: `https://your-domain.com/health`
- **API**: `https://your-domain.com/api/health`

### Monitoring Stack (Optional)

```bash
# Start monitoring services
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Access Grafana
http://your-domain.com:3001
# Default login: admin/admin123

# Access Prometheus
http://your-domain.com:9090
```

### Log Management

```bash
# View application logs
./scripts/deploy.sh logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs web
docker-compose -f docker-compose.prod.yml logs api

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 Maintenance

### Database Backups

Since you're using Supabase, database backups are handled automatically by Supabase. You can also create manual backups from the Supabase dashboard or using their CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Create a backup
supabase db dump --project-ref your-project-ref > backup.sql
```

### Updates and Scaling

```bash
# Update to latest code
git pull origin main
./scripts/deploy.sh

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale web=3 --scale api=2
```

### Troubleshooting

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Inspect service logs
docker-compose -f docker-compose.prod.yml logs service_name

# Check resource usage
docker stats

# Test connectivity
curl -I https://your-domain.com/health

# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## 🚨 Backup and Recovery

### Automated Backups

The deployment script creates backups before each deployment in the `backups/` directory.

### Manual Backup

```bash
# Create manual backup
mkdir -p backups/manual
docker-compose -f docker-compose.prod.yml ps > backups/manual/containers_$(date +%Y%m%d_%H%M%S).txt
cp .env.production backups/manual/.env.production_$(date +%Y%m%d_%H%M%S)
```

### Recovery

```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Restore environment
cp backups/manual/.env.production_TIMESTAMP .env.production

# Redeploy
./scripts/deploy.sh
```

## 📞 Support

For issues and support:
- Check logs: `./scripts/deploy.sh logs`
- Verify configuration: `./scripts/deploy.sh status`
- Health check: `./scripts/deploy.sh health`
- Monitor resources: `docker stats`

## 🔄 CI/CD Integration

For automated deployments, integrate with GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to EC2
        run: |
          ssh user@your-ec2-ip 'cd /opt/flipdocs && git pull && ./scripts/deploy.sh'
```