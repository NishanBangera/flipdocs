// TypeScript interfaces matching the backend schema

export interface Flipbook {
  id: string;
  name: string;
  slug: string;
  pdf_url: string;
  background_image_url?: string;
  is_published: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFlipbookData {
  name: string;
  pdf: File;
  backgroundImage?: File;
  isPublished: boolean;
}

export interface UpdateFlipbookData {
  name?: string;
  pdf?: File;
  backgroundImage?: File;
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

// UI-specific types for table display
export interface FlipbookTableItem {
  id: string;
  name: string;
  slug: string;
  status: "published" | "unpublished";
  createdAt: string;
  pdf_url: string;
  background_image_url?: string;
}