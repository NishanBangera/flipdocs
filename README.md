# FlipDocs# FlipDocs Turborepo



Convert PDFs into interactive flipbooks with ease.This is a Turborepo monorepo for FlipDocs - a document flipbook platform.



## Features## What's inside?



- 📄 PDF to flipbook conversionThis Turborepo includes the following packages/apps:

- 🔐 Secure authentication with Clerk

- 🗄️ File storage with Supabase### Apps

- 🚀 Containerized deployment

- ⚡ Fast performance with ElysiaJS and Next.js- `@flipdocs/web`: a [Next.js](https://nextjs.org/) app for the frontend

- `@flipdocs/api`: an [ElysiaJS](https://elysiajs.com/) API server powered by [Bun](https://bun.sh/)

## Quick Start

### Packages

### Development

```bash- `@flipdocs/ui`: shared React component library

# Install dependencies- `@flipdocs/config`: shared configuration and environment variables

npm install- `@flipdocs/types`: shared TypeScript type definitions



# Start development environment## Getting Started

docker compose -f docker-compose.dev.yml up -d

### Prerequisites

# Access the application

open http://localhost:3000- [Bun](https://bun.sh/) (latest version)

```- [Node.js](https://nodejs.org/) 18+ (for some development tools)



### Production### Installation

```bash

# Configure environment1. Clone the repository

cp .env.production .env2. Install dependencies:

# Edit .env with your actual values

```bash

# Deploybun install

docker compose -f docker-compose.prod.yml up -d```

```

### Development

## Documentation

To run all apps in development mode:

- **[Complete Deployment Guide](./DEPLOYMENT-GUIDE.md)** - Comprehensive setup and troubleshooting

- **[Environment Configuration](./DEPLOYMENT-GUIDE.md#environment-configuration)** - Required variables and setup```bash

- **[Troubleshooting](./DEPLOYMENT-GUIDE.md#troubleshooting)** - Common issues and solutionsbun dev

```

## Tech Stack

To run individual apps:

- **Frontend**: Next.js with TypeScript

- **Backend**: ElysiaJS with Bun runtime  ```bash

- **Database**: Supabase# Run only the web app

- **Authentication**: Clerkbun dev --filter=@flipdocs/web

- **Deployment**: Docker + GitHub Actions

- **Infrastructure**: EC2 + GHCR# Run only the API

bun dev --filter=@flipdocs/api

## Project Structure```



```### Building

flipdocs/

├── apps/To build all apps:

│   ├── api/              # ElysiaJS API

│   └── web/              # Next.js frontend```bash

├── packages/             # Shared packagesbun run build

├── docker-compose.dev.yml   # Development```

├── docker-compose.prod.yml  # Production

└── DEPLOYMENT-GUIDE.md   # Full documentationTo build individual apps:

```

```bash

## Contributing# Build only the web app

bun run build --filter=@flipdocs/web

1. Fork the repository

2. Create a feature branch# Build only the API

3. Make your changesbun run build --filter=@flipdocs/api

4. Test with `docker compose -f docker-compose.dev.yml up````

5. Submit a pull request

### Type Checking

## License

To run type checking across all projects:

MIT License - see LICENSE file for details.
```bash
bun run type-check
```

### Linting

To lint all projects:

```bash
bun run lint
```

## Project Structure

```
apps/
├── web/          # Next.js frontend application
│   ├── app/      # Next.js 13+ app directory
│   ├── components/ # React components
│   └── lib/      # Utility functions and API clients
└── api/          # ElysiaJS backend API
    ├── src/      # Source code
    └── dist/     # Built output

packages/
├── ui/           # Shared React component library
├── config/       # Shared configuration
└── types/        # Shared TypeScript types
```

## Environment Variables

Each app manages its own environment variables:

- **Web app**: Copy `apps/web/.env.example` to `apps/web/.env.local`
- **API**: Copy `apps/api/.env.example` to `apps/api/.env`

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: ElysiaJS, Bun, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Monorepo**: Turborepo
- **Package Manager**: Bun

## Deployment

### Frontend (Vercel)

The frontend is optimized for deployment on Vercel:

1. Connect your repository to Vercel
2. Set the build command to: `cd ../.. && bun run build --filter=@flipdocs/web`
3. Set the output directory to: `apps/web/.next`

### Backend (Railway/Fly.io)

The backend can be deployed to any platform that supports Bun:

1. Build the API: `bun run build --filter=@flipdocs/api`
2. Deploy the `apps/api` directory
3. Ensure the start command is: `bun dist/index.js`

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and type checking: `bun run type-check`
4. Submit a pull request

## Learn More

- [Turborepo](https://turbo.build/repo/docs)
- [Next.js](https://nextjs.org/docs)
- [ElysiaJS](https://elysiajs.com/introduction/quick-start.html)
- [Bun](https://bun.sh/docs)