/**
 * Utility functions for slug operations
 */

/**
 * Generate a slug from a given name
 * @param name - The name to convert to a slug
 * @returns The generated slug
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Validate slug format
 * @param slug - The slug to validate
 * @returns True if the slug format is valid
 */
export function isValidSlugFormat(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

/**
 * Extract filename from URL
 * @param url - The URL to extract filename from
 * @returns The extracted filename or empty string
 */
export function getFileNameFromUrl(url?: string): string {
  if (!url) return ""
  
  try {
    const u = new URL(url)
    const last = u.pathname.split("/").pop() || url
    return decodeURIComponent(last)
  } catch {
    const last = url.split("/").pop() || url
    return decodeURIComponent(last)
  }
}