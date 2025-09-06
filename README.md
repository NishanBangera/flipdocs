# FlipDocs

A modern document flipbook platform that converts PDFs into interactive flipbooks.

## ✨ Features

- 📄 **PDF to Flipbook Conversion** - Transform PDFs into interactive flipbooks
- 🔐 **Secure Authentication** - User management with Clerk
- 🗄️ **Cloud Storage** - File storage and management with Supabase
- 🚀 **Fast Performance** - Built with Next.js 15 and ElysiaJS
- 🔒 **SSL Production Ready** - HTTPS deployment with automated SSL certificates
- 📱 **Responsive Design** - Works on desktop and mobile devices

## 🚀 Quick Start

### Development

```bash
# Clone the repository
git clone https://github.com/NishanBangera/flipdocs.git
cd flipdocs

# Install dependencies
bun install

# Start development environment
bun dev
```

Access the application at [http://localhost:3000](http://localhost:3000)

### Production Deployment

**For complete deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

Quick deployment to EC2 with SSL:
```bash
# On your EC2 instance
curl -sSL https://raw.githubusercontent.com/NishanBangera/flipdocs/main/deploy-to-ec2.sh | bash
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | 🚀 Complete production deployment guide |
| **[DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)** | ✅ Pre-deployment checklist |
| **[GITHUB-ACTIONS-GUIDE.md](./GITHUB-ACTIONS-GUIDE.md)** | 🔄 CI/CD setup and automation |
| **[GITHUB-ACTIONS-SECRETS.md](./GITHUB-ACTIONS-SECRETS.md)** | 🔐 GitHub secrets configuration |

## 🏗️ Architecture

This is a monorepo built with Turborepo containing:

### Apps
- **`@flipdocs/web`** - Next.js 15 frontend application
- **`@flipdocs/api`** - ElysiaJS backend API powered by Bun

### Packages
- **`@flipdocs/ui`** - Shared React component library
- **`@flipdocs/config`** - Shared configuration and environment variables
- **`@flipdocs/types`** - Shared TypeScript type definitions

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: ElysiaJS, Bun, TypeScript  
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Storage**: Supabase Storage
- **Deployment**: Docker + GitHub Actions + EC2
- **SSL**: Let's Encrypt with automated renewal
- **Monorepo**: Turborepo
- **Package Manager**: Bun

## 🏗️ Project Structure

```
flipdocs/
├── apps/
│   ├── api/              # ElysiaJS backend API
│   └── web/              # Next.js frontend application
├── packages/
│   ├── ui/               # Shared React component library
│   ├── config/           # Shared configuration
│   └── types/            # Shared TypeScript types
├── docker/               # Docker configuration files
├── scripts/              # Deployment and utility scripts
├── docker-compose.dev.yml    # Development environment
├── docker-compose.ssl.yml    # SSL production environment
└── DEPLOYMENT.md         # Complete deployment guide
```

## 🛠️ Development

### Prerequisites
- [Bun](https://bun.sh/) (latest version)
- [Node.js](https://nodejs.org/) 18+ (for some development tools)

### Installation

```bash
# Clone the repository
git clone https://github.com/NishanBangera/flipdocs.git
cd flipdocs

# Install dependencies
bun install
```

### Available Scripts

```bash
# Development
bun dev                              # Run all apps in development
bun dev --filter=@flipdocs/web      # Run only frontend
bun dev --filter=@flipdocs/api      # Run only backend

# Building
bun run build                       # Build all apps
bun run build --filter=@flipdocs/web   # Build only frontend
bun run build --filter=@flipdocs/api   # Build only backend

# Quality Checks
bun run type-check                  # Type check all projects
bun run lint                        # Lint all projects
```

### Environment Variables

Each app manages its own environment variables:
- **Web app**: Copy `apps/web/.env.example` to `apps/web/.env.local`
- **API**: Copy `apps/api/.env.example` to `apps/api/.env`

## 🚀 Deployment

This project supports multiple deployment methods:

1. **Automated with GitHub Actions** - Push to deploy automatically
2. **Manual with Docker Compose** - Direct deployment with SSL
3. **Platform-specific** - Vercel (frontend) + Railway/Fly.io (backend)

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and type checking: `bun run type-check`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Learn More

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [ElysiaJS Documentation](https://elysiajs.com/introduction/quick-start.html)
- [Bun Documentation](https://bun.sh/docs)