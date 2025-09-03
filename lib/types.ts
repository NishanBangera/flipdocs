// TypeScript interfaces matching the backend schema

export interface Flipbook {
  id: string;
  name: string;
  slug: string;
  pdf_url: string;
  background_image_url?: string;
  cover_image_url?: string;
  is_published: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFlipbookData {
  name: string;
  slug: string; // Now required since we always provide it
  pdf: File;
  backgroundImage?: File;
  coverImage?: File;
  isPublished: boolean;
}

export interface UpdateFlipbookData {
  name?: string;
  slug?: string;
  pdf?: File;
  backgroundImage?: File;
  coverImage?: File;
  isPublished?: boolean;
}

export interface DashboardStats {
  totalFlipbooks: number;
  publishedFlipbooks: number;
  unpublishedFlipbooks: number;
  // recent: Flipbook[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success?: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface SlugValidationResult {
  available: boolean;
  suggestedSlug?: string;
  existingSlugs: string[];
}

// UI-specific types for table display
export interface FlipbookTableItem {
  id: string;
  name: string;
  slug: string;
  status: "published" | "unpublished";
  createdAt: string;
  pdf_url: string;
  background_image_url?: string;
  cover_image_url?: string;
}