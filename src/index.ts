import 'dotenv/config';
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { flipbookRoutes, publicFlipbookRoutes } from './routes/flipbooks';
import { dashboardRoutes } from './routes/dashboard';
import { userRoutes } from './routes/user';

const app = new Elysia()
  .use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
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
  .use(dashboardRoutes)
  .use(userRoutes)
  .use(flipbookRoutes)
  .use(publicFlipbookRoutes)
  .listen(process.env.PORT || 3000);

console.log(`🦊 Elysia is running at http://localhost:${process.env.PORT || 3000}`);

export default app;