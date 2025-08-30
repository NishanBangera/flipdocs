import { supabase } from '../config/supabase';
import { StorageService } from './storage.service';
import { generateUniqueSlug } from '../utils/slug.utils';
import { Flipbook, CreateFlipbookDTO, UpdateFlipbookDTO } from '../types';

export class FlipbookService {
  static async create(userId: string, data: CreateFlipbookDTO): Promise<Flipbook> {
    // Generate unique slug
    console.log("checkkkkkkkk233333333")
    const slug = await generateUniqueSlug(data.name);

    // Upload PDF
    const pdfUrl = await StorageService.uploadPDF(data.pdf, userId);

    // Upload background image if provided
    let backgroundImageUrl = null;
    if (data.backgroundImage) {
      backgroundImageUrl = await StorageService.uploadBackgroundImage(data.backgroundImage, userId);
    }

    // Create flipbook record
    const { data: flipbook, error } = await supabase
      .from('flipbooks')
      .insert({
        user_id: userId,
        name: data.name,
        slug,
        pdf_url: pdfUrl,
        background_image_url: backgroundImageUrl,
        is_published: data.isPublished
      })
      .select()
      .single();

    if (error) throw error;

    return flipbook;
  }

  static async update(flipbookId: string, userId: string, data: UpdateFlipbookDTO): Promise<Flipbook> {
    // Get existing flipbook
    const { data: existingFlipbook } = await supabase
      .from('flipbooks')
      .select('*')
      .eq('id', flipbookId)
      .eq('user_id', userId)
      .single();

    if (!existingFlipbook) {
      throw new Error('Flipbook not found');
    }

    const updates: any = {
      updated_at: new Date().toISOString()
    };

    // Update name and regenerate slug if name changed
    if (data.name && data.name !== existingFlipbook.name) {
      updates.name = data.name;
      updates.slug = await generateUniqueSlug(data.name);
    }

    // Update PDF if provided
    if (data.pdf) {
      // Delete old PDF
      await StorageService.deleteFile(existingFlipbook.pdf_url, 'flipbook-pdfs');
      // Upload new PDF
      updates.pdf_url = await StorageService.uploadPDF(data.pdf, userId);
    }

    // Update background image if provided
    if (data.backgroundImage) {
      // Delete old background if exists
      if (existingFlipbook.background_image_url) {
        await StorageService.deleteFile(existingFlipbook.background_image_url, 'flipbook-backgrounds');
      }
      // Upload new background
      updates.background_image_url = await StorageService.uploadBackgroundImage(data.backgroundImage, userId);
    }

    // Update publish status
    if (data.isPublished !== undefined) {
      updates.is_published = data.isPublished;
    }

    // Update flipbook
    const { data: updatedFlipbook, error } = await supabase
      .from('flipbooks')
      .update(updates)
      .eq('id', flipbookId)
      .select()
      .single();

    if (error) throw error;

    return updatedFlipbook;
  }

  static async delete(flipbookId: string, userId: string): Promise<void> {
    // Get flipbook to delete associated files
    const { data: flipbook } = await supabase
      .from('flipbooks')
      .select('*')
      .eq('id', flipbookId)
      .eq('user_id', userId)
      .single();

    if (!flipbook) {
      throw new Error('Flipbook not found');
    }

    // Delete PDF
    await StorageService.deleteFile(flipbook.pdf_url, 'flipbook-pdfs');

    // Delete background image if exists
    if (flipbook.background_image_url) {
      await StorageService.deleteFile(flipbook.background_image_url, 'flipbook-backgrounds');
    }

    // Delete flipbook record
    const { error } = await supabase
      .from('flipbooks')
      .delete()
      .eq('id', flipbookId);

    if (error) throw error;
  }

  static async getAll(userId: string): Promise<Flipbook[]> {
    const { data, error } = await supabase
      .from('flipbooks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    console.log('getAll flipbooks data:', data);
    if (error) throw error;
    
    return data || [];
  }

  static async getBySlug(slug: string): Promise<Flipbook | null> {
    const { data, error } = await supabase
      .from('flipbooks')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) return null;

    return data;
  }

  static async getById(flipbookId: string, userId: string): Promise<Flipbook | null> {
    const { data, error } = await supabase
      .from('flipbooks')
      .select('*')
      .eq('id', flipbookId)
      .eq('user_id', userId)
      .single();

    if (error) return null;

    return data;
  }
}