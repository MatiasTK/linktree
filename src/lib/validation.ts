import { AVAILABLE_ICONS, type IconType } from './types';

// Maximum lengths for string fields
export const MAX_LENGTHS = {
  title: 100,
  slug: 50,
  label: 100,
  url: 2000,
  description: 500,

  profile_initial: 1,
  profile_image_url: 2000,
  site_title: 100,
  site_description: 500,
} as const;

// Allowed URL protocols
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Validate and sanitize a URL
 * Returns null if invalid, sanitized URL if valid
 */
export function validateUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (trimmed.length > MAX_LENGTHS.url) return null;

  try {
    const parsed = new URL(trimmed);

    // Block dangerous protocols like javascript:, data:, vbscript:
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return null;
    }

    return trimmed;
  } catch {
    // Not a valid URL
    return null;
  }
}

/**
 * Validate and sanitize a slug
 * Only allows lowercase letters, numbers, and hyphens
 */
export function validateSlug(slug: string): string | null {
  if (!slug || typeof slug !== 'string') return null;

  const trimmed = slug.trim().toLowerCase();
  if (trimmed.length > MAX_LENGTHS.slug) return null;

  // Only allow a-z, 0-9, and hyphens, no leading/trailing hyphens
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Validate icon type against allowed list
 */
export function validateIconType(iconType: string): IconType {
  if (AVAILABLE_ICONS.includes(iconType as IconType)) {
    return iconType as IconType;
  }
  return 'link'; // Default fallback
}

/**
 * Sanitize a string field (trim and limit length)
 */
export function sanitizeString(
  value: unknown,
  maxLength: number,
  defaultValue: string = ''
): string {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value !== 'string') return defaultValue;

  return value.trim().slice(0, maxLength);
}

/**
 * Validate that a value is a positive integer
 */
export function validatePositiveInt(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return defaultValue;
}

/**
 * Validate profile image URL (must be https for security)
 */
export function validateImageUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_LENGTHS.profile_image_url) return null;

  try {
    const parsed = new URL(trimmed);

    // Only allow https for images
    if (parsed.protocol !== 'https:') {
      return null;
    }

    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validate link creation/update data
 */
export function validateLinkData(data: Record<string, unknown>): ValidationResult<{
  section_id?: number;
  label?: string;
  url?: string;
  icon_type?: IconType;
  is_visible?: boolean;
  display_order?: number;

}> {
  const result: Record<string, unknown> = {};

  if ('section_id' in data) {
    const sectionId = validatePositiveInt(data.section_id, -1);
    if (sectionId < 0) {
      return { success: false, error: 'Invalid section_id' };
    }
    result.section_id = sectionId;
  }

  if ('label' in data) {
    const label = sanitizeString(data.label, MAX_LENGTHS.label);
    if (label.length === 0) {
      return { success: false, error: 'Label is required' };
    }
    result.label = label;
  }

  if ('url' in data) {
    const url = validateUrl(data.url as string);
    if (url === null) {
      return { success: false, error: 'Invalid URL. Must be http, https, mailto, or tel protocol.' };
    }
    result.url = url;
  }

  if ('icon_type' in data) {
    result.icon_type = validateIconType(data.icon_type as string);
  }

  if ('is_visible' in data) {
    result.is_visible = Boolean(data.is_visible);
  }

  if ('display_order' in data) {
    result.display_order = validatePositiveInt(data.display_order);
  }



  return { success: true, data: result };
}

/**
 * Validate section creation/update data
 */
export function validateSectionData(data: Record<string, unknown>): ValidationResult<{
  title?: string;
  slug?: string;
  show_in_main?: boolean;
  display_order?: number;
  description?: string | null;
  profile_initial?: string | null;
  profile_image_url?: string | null;
}> {
  const result: Record<string, unknown> = {};

  if ('title' in data) {
    const title = sanitizeString(data.title, MAX_LENGTHS.title);
    if (title.length === 0) {
      return { success: false, error: 'Title is required' };
    }
    result.title = title;
  }

  if ('slug' in data) {
    const slug = validateSlug(data.slug as string);
    if (slug === null) {
      return { success: false, error: 'Invalid slug. Use only lowercase letters, numbers, and hyphens.' };
    }
    result.slug = slug;
  }

  if ('show_in_main' in data) {
    result.show_in_main = Boolean(data.show_in_main);
  }

  if ('display_order' in data) {
    result.display_order = validatePositiveInt(data.display_order);
  }

  if ('description' in data) {
    const description = sanitizeString(data.description, MAX_LENGTHS.description);
    result.description = description.length > 0 ? description : null;
  }

  if ('profile_initial' in data) {
    const initial = sanitizeString(data.profile_initial, MAX_LENGTHS.profile_initial);
    result.profile_initial = initial.length > 0 ? initial.toUpperCase() : null;
  }

  if ('profile_image_url' in data) {
    const imageUrl = data.profile_image_url as string;
    if (imageUrl && imageUrl.trim().length > 0) {
      const validUrl = validateImageUrl(imageUrl);
      if (validUrl === null) {
        return { success: false, error: 'Invalid profile image URL. Must be a valid HTTPS URL.' };
      }
      result.profile_image_url = validUrl;
    } else {
      result.profile_image_url = null;
    }
  }

  return { success: true, data: result };
}

/**
 * Validate settings data
 */
export function validateSettingsData(data: Record<string, unknown>): ValidationResult<{
  site_title?: string;
  site_description?: string;
  profile_initial?: string;
  profile_image_url?: string;
}> {
  const result: Record<string, unknown> = {};

  if ('site_title' in data) {
    const title = sanitizeString(data.site_title, MAX_LENGTHS.site_title);
    if (title.length === 0) {
      return { success: false, error: 'Site title is required' };
    }
    result.site_title = title;
  }

  if ('site_description' in data) {
    result.site_description = sanitizeString(data.site_description, MAX_LENGTHS.site_description);
  }

  if ('profile_initial' in data) {
    const initial = sanitizeString(data.profile_initial, MAX_LENGTHS.profile_initial);
    result.profile_initial = initial.toUpperCase();
  }

  if ('profile_image_url' in data) {
    const imageUrl = data.profile_image_url as string;
    if (imageUrl && imageUrl.trim().length > 0) {
      const validUrl = validateImageUrl(imageUrl);
      if (validUrl === null) {
        return { success: false, error: 'Invalid profile image URL. Must be a valid HTTPS URL.' };
      }
      result.profile_image_url = validUrl;
    } else {
      result.profile_image_url = '';
    }
  }

  return { success: true, data: result };
}
