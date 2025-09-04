import 'dotenv/config';
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { flipbookRoutes, publicFlipbookRoutes } from './routes/flipbooks';
import { dashboardRoutes } from './routes/dashboard';
import { userRoutes } from './routes/user';

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
    port: process.env.PORT || 3000,
    hostname: 'localhost'
  });

const port = process.env.PORT || 3000;
console.log(`🦊 Elysia is running at http://localhost:${port}`);

export default app;