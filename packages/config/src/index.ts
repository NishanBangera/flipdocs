// Environment configuration
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3001',
  
  // Database
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  
  // Authentication
  CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
  
  // Frontend
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  
  // File storage
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: ['application/pdf'],
} as const;

// API endpoints
export const API_ENDPOINTS = {
  USERS: '/api/users',
  FLIPBOOKS: '/api/flipbooks',
  DASHBOARD: '/api/dashboard',
} as const;

// App configuration
export const APP_CONFIG = {
  APP_NAME: 'FlipDocs',
  APP_DESCRIPTION: 'Turn your PDFs into beautiful flipbooks',
  ITEMS_PER_PAGE: 10,
  MAX_FLIPBOOKS_FREE: 5,
} as const;

export type Environment = typeof env;