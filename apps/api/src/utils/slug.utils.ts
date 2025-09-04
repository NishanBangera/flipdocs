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

export async function validateSlugAvailability(slug: string, excludeId?: string): Promise<{
  available: boolean;
  suggestedSlug?: string;
  existingSlugs: string[];
}> {
  const baseSlug = slugify(slug, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });

  // Get all slugs that start with the base slug
  let query = supabase
    .from('flipbooks')
    .select('slug')
    .like('slug', `${baseSlug}%`);

  // Exclude current flipbook if updating
  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data: existingFlipbooks } = await query;
  const existingSlugs = existingFlipbooks?.map(fb => fb.slug) || [];

  // Check if the exact slug is available
  const available = !existingSlugs.includes(baseSlug);

  let suggestedSlug = baseSlug;
  if (!available) {
    // Find the next available number
    let counter = 1;
    suggestedSlug = `${baseSlug}-${counter}`;
    
    while (existingSlugs.includes(suggestedSlug)) {
      counter++;
      suggestedSlug = `${baseSlug}-${counter}`;
    }
  }

  return {
    available,
    suggestedSlug: available ? baseSlug : suggestedSlug,
    existingSlugs
  };
}