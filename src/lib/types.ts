// TypeScript types for Linktree Clone

export interface Section {
  id: number;
  title: string;
  slug: string;
  show_in_main: number; // 0 or 1 (boolean in SQLite)
  display_order: number;
  description: string | null;
  profile_initial: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: number;
  section_id: number;
  label: string;
  url: string;
  /** a name from AVAILABLE_ICONS, or 'auto' for the destination's favicon */
  icon_type: string;
  description: string | null;
  is_visible: number; // 0 or 1
  display_order: number;
  clicks: number;

  created_at: string;
  updated_at: string;
}

export interface Settings {
  site_title: string;
  site_description: string;
  profile_initial: string;
  profile_image_url: string;
}

// API Request/Response types
export interface CreateSectionRequest {
  title: string;
  slug: string;
  show_in_main?: boolean;
  display_order?: number;
  description?: string;
  profile_initial?: string;
  profile_image_url?: string;
}

export interface UpdateSectionRequest {
  title?: string;
  slug?: string;
  show_in_main?: boolean;
  display_order?: number;
  description?: string;
  profile_initial?: string;
  profile_image_url?: string;
  confirmSwap?: boolean;
}

export interface CreateLinkRequest {
  section_id: number;
  label: string;
  url: string;
  icon_type?: string;
  is_visible?: boolean;
  display_order?: number;

}

export interface UpdateLinkRequest {
  label?: string;
  url?: string;
  icon_type?: string;
  is_visible?: boolean;
  display_order?: number;

  confirmSwap?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiResponseWithWarning<T, C = unknown> extends ApiResponse<T> {
  warning?: boolean;
  message?: string;
  conflictWith?: C;
  currentOrder?: number;
}

// Section with its links
export interface SectionWithLinks extends Section {
  links: Link[];
}

// Icon options for the admin selector
export const AVAILABLE_ICONS = [
  'auto',
  'link',
  'github',
  'twitter',
  'instagram',
  'facebook',
  'linkedin',
  'youtube',
  'twitch',
  'discord',
  'tiktok',
  'globe',
  'mail',
  'phone',
  'map-pin',
  'book-open',
  'file-text',
  'shopping-bag',
  'coffee',
  'heart',
  'star',
  'music',
  'camera',
  'video',
  'code',
  'terminal',
  'palette',
  'pen-tool',
  'briefcase',
  'calendar',
  'message-circle',
] as const;

export type IconType = typeof AVAILABLE_ICONS[number];

// Portfolio project (text fields come in _en / _es pairs)
export interface Project {
  id: number;
  slug: string;
  name: string;
  year: string | null;
  kind_en: string;
  kind_es: string;
  summary_en: string;
  summary_es: string;
  body_en: string;
  body_es: string;
  /** comma-separated */
  stack: string;
  image_url: string | null;
  site_url: string | null;
  repo_url: string | null;
  is_visible: number; // 0 or 1
  display_order: number;
  created_at: string;
  updated_at: string;
}
