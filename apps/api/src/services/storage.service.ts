import { supabase } from '../config/supabase';
import { nanoid } from 'nanoid';

export class StorageService {
  static async uploadPDF(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${nanoid()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('flipbook-pdfs')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('flipbook-pdfs')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  static async uploadBackgroundImage(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${nanoid()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('flipbook-backgrounds')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('flipbook-backgrounds')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  static async uploadCoverImage(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${nanoid()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('flipbook-covers')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('flipbook-covers')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  static async deleteFile(url: string, bucket: 'flipbook-pdfs' | 'flipbook-backgrounds' | 'flipbook-covers'): Promise<void> {
    // Extract file path from URL
    const urlParts = url.split('/');
    const filePath = urlParts.slice(-2).join('/'); // Gets userId/filename

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
  }
}