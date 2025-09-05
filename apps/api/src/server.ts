import 'dotenv/config';
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { flipbookRoutes, publicFlipbookRoutes } from './routes/flipbooks';
import { dashboardRoutes } from './routes/dashboard';
import { userRoutes } from './routes/user';

const port = parseInt(process.env.PORT || '3000', 10);

const app = new Elysia()
  .use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }))
  .use(swagger({
    documentation: {
      info: {
        title: 'Flipbook API',
        version: '1.0.0'
      }
    }
  }))
  .get('/', () => 'Flipbook API is running!')
  .get('/health', () => ({
    status: 'healthy',
    auth: {
      clerk: {
        configured: !!process.env.CLERK_SECRET_KEY
      }
    },
    database: {
      supabase: {
        configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
      }
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  }))
  .get('/debug/clerk', () => ({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...',
    secretKeyPresent: !!process.env.CLERK_SECRET_KEY,
    frontendUrl: process.env.FRONTEND_URL
  }))
  .use(dashboardRoutes)
  .use(userRoutes)
  .use(flipbookRoutes)
  .use(publicFlipbookRoutes)
  .listen({
    port: port,
    hostname: '0.0.0.0'
  });

console.log(`🦊 Elysia is running at http://0.0.0.0:${port}`);