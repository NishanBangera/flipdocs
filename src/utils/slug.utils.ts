import slugify from 'slugify';
import { nanoid } from 'nanoid';
import { supabase } from '../config/supabase';

export async function generateUniqueSlug(name: string): Promise<string> {
  let baseSlug = slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });

  // Check if slug exists
  const { data: existingFlipbooks } = await supabase
    .from('flipbooks')
    .select('slug')
    .like('slug', `${baseSlug}%`);

  if (!existingFlipbooks || existingFlipbooks.length === 0) {
    return baseSlug;
  }

  // Find the next available number
  let counter = 1;
  let newSlug = `${baseSlug}-${counter}`;
  
  while (existingFlipbooks.some(fb => fb.slug === newSlug)) {
    counter++;
    newSlug = `${baseSlug}-${counter}`;
  }

  return newSlug;
}