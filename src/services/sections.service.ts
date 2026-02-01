import { execute, query, queryFirst } from '@/lib/db';
import type { Section } from '@/lib/types';
import {
  type ServiceResult,
  handleDisplayOrderSwap,
  buildAndExecuteUpdate,
  boolToInt,
} from './base.service';

// ============================================================================
// Types
// ============================================================================

export interface SectionFilters {
  mainOnly?: boolean;
}

export interface CreateSectionData {
  title: string;
  slug: string;
  show_in_main?: boolean;
  display_order?: number;
  description?: string | null;
  profile_initial?: string | null;
  profile_image_url?: string | null;
}

export interface UpdateSectionData {
  title?: string;
  slug?: string;
  show_in_main?: boolean;
  display_order?: number;
  description?: string | null;
  profile_initial?: string | null;
  profile_image_url?: string | null;
}

// ============================================================================
// Sections Service
// ============================================================================

export const sectionsService = {
  /**
   * Find all sections with optional filters
   */
  async findAll(filters: SectionFilters = {}): Promise<ServiceResult<Section[]>> {
    try {
      let sql = 'SELECT * FROM sections';
      if (filters.mainOnly) {
        sql += ' WHERE show_in_main = 1';
      }
      sql += ' ORDER BY display_order ASC';

      const sections = await query<Section>(sql);
      return { success: true, data: sections };
    } catch (error) {
      console.error('Error fetching sections:', error);
      return { success: false, error: 'Failed to fetch sections', status: 500 };
    }
  },

  /**
   * Find a section by ID
   */
  async findById(id: number): Promise<ServiceResult<Section>> {
    try {
      const section = await queryFirst<Section>('SELECT * FROM sections WHERE id = ?', [id]);

      if (!section) {
        return { success: false, error: 'Section not found', status: 404 };
      }

      return { success: true, data: section };
    } catch (error) {
      console.error('Error fetching section:', error);
      return { success: false, error: 'Failed to fetch section', status: 500 };
    }
  },

  /**
   * Find a section by slug
   */
  async findBySlug(slug: string): Promise<ServiceResult<Section>> {
    try {
      const section = await queryFirst<Section>('SELECT * FROM sections WHERE slug = ?', [slug]);

      if (!section) {
        return { success: false, error: 'Section not found', status: 404 };
      }

      return { success: true, data: section };
    } catch (error) {
      console.error('Error fetching section:', error);
      return { success: false, error: 'Failed to fetch section', status: 500 };
    }
  },

  /**
   * Create a new section
   */
  async create(data: CreateSectionData): Promise<ServiceResult<Section>> {
    try {
      // Check if slug already exists
      const existing = await query<Section>('SELECT id FROM sections WHERE slug = ?', [data.slug]);
      if (existing.length > 0) {
        return { success: false, error: 'A section with this slug already exists', status: 400 };
      }

      const result = await execute(
        `INSERT INTO sections (title, slug, show_in_main, display_order, description, profile_initial, profile_image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.title,
          data.slug,
          boolToInt(data.show_in_main ?? true),
          data.display_order ?? 0,
          data.description ?? null,
          data.profile_initial ?? null,
          data.profile_image_url ?? null,
        ]
      );

      const newSection = await queryFirst<Section>('SELECT * FROM sections WHERE id = ?', [
        result.meta.last_row_id,
      ]);

      return { success: true, data: newSection! };
    } catch (error) {
      console.error('Error creating section:', error);
      const message = error instanceof Error ? error.message : 'Failed to create section';
      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Update a section
   */
  async update(
    id: number,
    data: UpdateSectionData,
    confirmSwap: boolean = false
  ): Promise<ServiceResult<Section>> {
    try {
      // Find existing section
      const existing = await queryFirst<Section>('SELECT * FROM sections WHERE id = ?', [id]);
      if (!existing) {
        return { success: false, error: 'Section not found', status: 404 };
      }

      // Check slug uniqueness if updating slug
      if (data.slug !== undefined && data.slug !== existing.slug) {
        const slugConflict = await query<Section>(
          'SELECT id FROM sections WHERE slug = ? AND id != ?',
          [data.slug, id]
        );
        if (slugConflict.length > 0) {
          return { success: false, error: 'A section with this slug already exists', status: 400 };
        }
      }

      // Handle display_order conflict
      if (data.display_order !== undefined) {
        const swapResult = await handleDisplayOrderSwap({
          table: 'sections',
          currentItem: existing,
          newOrder: data.display_order,
          confirmSwap,
          nameField: 'title',
        });
        if (swapResult) return swapResult as ServiceResult<Section>;
      }

      // Build and execute update
      const fieldCount = await buildAndExecuteUpdate({
        table: 'sections',
        id,
        data: data as unknown as Record<string, unknown>,
        fieldMappings: [
          { field: 'title', column: 'title' },
          { field: 'slug', column: 'slug' },
          { field: 'show_in_main', column: 'show_in_main', transform: boolToInt },
          { field: 'display_order', column: 'display_order' },
          { field: 'description', column: 'description' },
          { field: 'profile_initial', column: 'profile_initial' },
          { field: 'profile_image_url', column: 'profile_image_url' },
        ],
      });

      if (fieldCount === 0) {
        return { success: false, error: 'No fields to update', status: 400 };
      }

      const updated = await queryFirst<Section>('SELECT * FROM sections WHERE id = ?', [id]);
      return { success: true, data: updated! };
    } catch (error) {
      console.error('Error updating section:', error);
      return { success: false, error: 'Failed to update section', status: 500 };
    }
  },

  /**
   * Delete a section
   */
  async delete(id: number): Promise<ServiceResult<{ deleted: boolean }>> {
    try {
      const existing = await queryFirst<Section>('SELECT * FROM sections WHERE id = ?', [id]);
      if (!existing) {
        return { success: false, error: 'Section not found', status: 404 };
      }

      await execute('DELETE FROM sections WHERE id = ?', [id]);
      return { success: true, data: { deleted: true } };
    } catch (error) {
      console.error('Error deleting section:', error);
      return { success: false, error: 'Failed to delete section', status: 500 };
    }
  },

  /**
   * Get sections visible on the main page (no error wrapper, returns empty array on error)
   * Used by public pages
   */
  async getVisible(): Promise<Section[]> {
    try {
      return await query<Section>(
        'SELECT * FROM sections WHERE show_in_main = 1 ORDER BY display_order ASC'
      );
    } catch (error) {
      console.error('Error fetching sections:', error);
      return [];
    }
  },

  /**
   * Get a section by slug (returns null on not found)
   * Used by public pages
   */
  async getBySlug(slug: string): Promise<Section | null> {
    try {
      return await queryFirst<Section>('SELECT * FROM sections WHERE slug = ?', [slug]);
    } catch (error) {
      console.error('Error fetching section:', error);
      return null;
    }
  },

  /**
   * Get all sections (no error wrapper, returns empty array on error)
   * Used for dashboard stats
   */
  async getAll(): Promise<Section[]> {
    try {
      return await query<Section>('SELECT * FROM sections ORDER BY display_order ASC');
    } catch (error) {
      console.error('Error fetching sections:', error);
      return [];
    }
  },
};
