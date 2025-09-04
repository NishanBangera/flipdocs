import { z } from 'zod';

// User types
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

// Flipbook types
export const flipbookSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  userId: z.string(),
  fileUrl: z.string(),
  thumbnailUrl: z.string().optional(),
  isPublic: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Flipbook = z.infer<typeof flipbookSchema>;

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard types
export interface DashboardStats {
  totalFlipbooks: number;
  totalViews: number;
  totalStorage: number;
}

// Form types
export const createFlipbookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export type CreateFlipbookInput = z.infer<typeof createFlipbookSchema>;

export const updateFlipbookSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateFlipbookInput = z.infer<typeof updateFlipbookSchema>;