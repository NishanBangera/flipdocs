export interface User {
  id: string;
  clerk_id: string;
  email: string;
  name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Flipbook {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  pdf_url: string;
  background_image_url?: string;
  is_published: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFlipbookDTO {
  name: string;
  pdf: File;
  backgroundImage?: File;
  isPublished: boolean;
}

export interface UpdateFlipbookDTO {
  name?: string;
  pdf?: File;
  backgroundImage?: File;
  isPublished?: boolean;
}