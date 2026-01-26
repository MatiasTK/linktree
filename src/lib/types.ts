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
  icon_type: string;
  is_visible: number; // 0 or 1
  display_order: number;
  clicks: number;
  group_title: string | null;
  group_order: number;
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
  group_title?: string;
  group_order?: number;
}

export interface UpdateLinkRequest {
  label?: string;
  url?: string;
  icon_type?: string;
  is_visible?: boolean;
  display_order?: number;
  group_title?: string;
  group_order?: number;
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
