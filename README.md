# FlipDocs Turborepo

This is a Turborepo monorepo for FlipDocs - a document flipbook platform.

## What's inside?

This Turborepo includes the following packages/apps:

### Apps

- `@flipdocs/web`: a [Next.js](https://nextjs.org/) app for the frontend
- `@flipdocs/api`: an [ElysiaJS](https://elysiajs.com/) API server powered by [Bun](https://bun.sh/)

### Packages

- `@flipdocs/ui`: shared React component library
- `@flipdocs/config`: shared configuration and environment variables
- `@flipdocs/types`: shared TypeScript type definitions

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [Node.js](https://nodejs.org/) 18+ (for some development tools)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
bun install
```

### Development

To run all apps in development mode:

```bash
bun dev
```

To run individual apps:

```bash
# Run only the web app
bun dev --filter=@flipdocs/web

# Run only the API
bun dev --filter=@flipdocs/api
```

### Building

To build all apps:

```bash
bun run build
```

To build individual apps:

```bash
# Build only the web app
bun run build --filter=@flipdocs/web

# Build only the API
bun run build --filter=@flipdocs/api
```

### Type Checking

To run type checking across all projects:

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