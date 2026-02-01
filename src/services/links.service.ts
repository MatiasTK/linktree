import { execute, query, queryFirst } from '@/lib/db';
import type { Link } from '@/lib/types';
import {
  type ServiceResult,
  handleDisplayOrderSwap,
  buildAndExecuteUpdate,
  boolToInt,
} from './base.service';

// ============================================================================
// Types
// ============================================================================

export interface LinkFilters {
  sectionId?: number;
  visibleOnly?: boolean;
}

export interface CreateLinkData {
  section_id: number;
  label: string;
  url: string;
  icon_type?: string;
  is_visible?: boolean;
  display_order?: number;
  group_title?: string | null;
  group_order?: number;
}

export interface UpdateLinkData {
  label?: string;
  url?: string;
  icon_type?: string;
  is_visible?: boolean;
  display_order?: number;
  group_title?: string | null;
  group_order?: number;
}

// ============================================================================
// Links Service
// ============================================================================

export const linksService = {
  /**
   * Find all links with optional filters
   */
  async findAll(filters: LinkFilters = {}): Promise<ServiceResult<Link[]>> {
    try {
      let sql = 'SELECT * FROM links';
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (filters.sectionId !== undefined) {
        conditions.push('section_id = ?');
        params.push(filters.sectionId);
      }

      if (filters.visibleOnly) {
        conditions.push('is_visible = 1');
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY display_order ASC';

      const links = await query<Link>(sql, params);
      return { success: true, data: links };
    } catch (error) {
      console.error('Error fetching links:', error);
      return { success: false, error: 'Failed to fetch links', status: 500 };
    }
  },

  /**
   * Find a link by ID
   */
  async findById(id: number): Promise<ServiceResult<Link>> {
    try {
      const link = await queryFirst<Link>('SELECT * FROM links WHERE id = ?', [id]);

      if (!link) {
        return { success: false, error: 'Link not found', status: 404 };
      }

      return { success: true, data: link };
    } catch (error) {
      console.error('Error fetching link:', error);
      return { success: false, error: 'Failed to fetch link', status: 500 };
    }
  },

  /**
   * Create a new link
   */
  async create(data: CreateLinkData): Promise<ServiceResult<Link>> {
    try {
      const result = await execute(
        `INSERT INTO links (section_id, label, url, icon_type, is_visible, display_order, group_title, group_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.section_id,
          data.label,
          data.url,
          data.icon_type ?? 'link',
          boolToInt(data.is_visible ?? true),
          data.display_order ?? 0,
          data.group_title ?? null,
          data.group_order ?? 0,
        ]
      );

      const newLink = await queryFirst<Link>('SELECT * FROM links WHERE id = ?', [
        result.meta.last_row_id,
      ]);

      return { success: true, data: newLink! };
    } catch (error) {
      console.error('Error creating link:', error);
      const message = error instanceof Error ? error.message : 'Failed to create link';
      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Update a link
   */
  async update(
    id: number,
    data: UpdateLinkData,
    confirmSwap: boolean = false
  ): Promise<ServiceResult<Link>> {
    try {
      // Find existing link
      const existing = await queryFirst<Link>('SELECT * FROM links WHERE id = ?', [id]);
      if (!existing) {
        return { success: false, error: 'Link not found', status: 404 };
      }

      // Handle display_order conflict within same section
      if (data.display_order !== undefined) {
        const swapResult = await handleDisplayOrderSwap({
          table: 'links',
          currentItem: existing,
          newOrder: data.display_order,
          confirmSwap,
          sectionId: existing.section_id,
          nameField: 'label',
        });
        if (swapResult) return swapResult as ServiceResult<Link>;
      }

      // Build and execute update
      const fieldCount = await buildAndExecuteUpdate({
        table: 'links',
        id,
        data: data as unknown as Record<string, unknown>,
        fieldMappings: [
          { field: 'label', column: 'label' },
          { field: 'url', column: 'url' },
          { field: 'icon_type', column: 'icon_type' },
          { field: 'is_visible', column: 'is_visible', transform: boolToInt },
          { field: 'display_order', column: 'display_order' },
          { field: 'group_title', column: 'group_title' },
          { field: 'group_order', column: 'group_order' },
        ],
      });

      if (fieldCount === 0) {
        return { success: false, error: 'No fields to update', status: 400 };
      }

      const updated = await queryFirst<Link>('SELECT * FROM links WHERE id = ?', [id]);
      return { success: true, data: updated! };
    } catch (error) {
      console.error('Error updating link:', error);
      return { success: false, error: 'Failed to update link', status: 500 };
    }
  },

  /**
   * Delete a link
   */
  async delete(id: number): Promise<ServiceResult<{ deleted: boolean }>> {
    try {
      const existing = await queryFirst<Link>('SELECT * FROM links WHERE id = ?', [id]);
      if (!existing) {
        return { success: false, error: 'Link not found', status: 404 };
      }

      await execute('DELETE FROM links WHERE id = ?', [id]);
      return { success: true, data: { deleted: true } };
    } catch (error) {
      console.error('Error deleting link:', error);
      return { success: false, error: 'Failed to delete link', status: 500 };
    }
  },

  /**
   * Track a link click (fire-and-forget operation)
   */
  async trackClick(id: number | string): Promise<void> {
    try {
      await execute(
        'UPDATE links SET clicks = clicks + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  },

  /**
   * Get top performing links by click count
   */
  async getTopLinks(limit: number = 5): Promise<ServiceResult<Link[]>> {
    try {
      const links = await query<Link>('SELECT * FROM links ORDER BY clicks DESC');
      return { success: true, data: links.slice(0, limit) };
    } catch (error) {
      console.error('Error fetching top links:', error);
      return { success: false, error: 'Failed to fetch top links', status: 500 };
    }
  },

  /**
   * Get visible links for a section, ordered by group and display order
   * Used by public pages
   */
  async getVisibleBySection(sectionId: number): Promise<Link[]> {
    try {
      return await query<Link>(
        'SELECT * FROM links WHERE section_id = ? AND is_visible = 1 ORDER BY group_order ASC, display_order ASC',
        [sectionId]
      );
    } catch (error) {
      console.error('Error fetching links:', error);
      return [];
    }
  },

  /**
   * Get all links (no error wrapper, returns empty array on error)
   * Used for dashboard stats
   */
  async getAll(): Promise<Link[]> {
    try {
      return await query<Link>('SELECT * FROM links ORDER BY display_order ASC');
    } catch (error) {
      console.error('Error fetching links:', error);
      return [];
    }
  },
};
