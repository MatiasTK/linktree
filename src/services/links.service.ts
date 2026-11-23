import { execute, query, queryFirst } from '@/lib/db';
import type { Link } from '@/lib/types';
import {
  type ServiceResult,
  boolToInt,
  buildAndExecuteUpdate,
  handleDisplayOrderSwap,
  shiftDisplayOrdersForInsert,
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
  description?: string | null;
  is_visible?: boolean;
  display_order?: number;
}

export interface UpdateLinkData {
  section_id?: number;
  label?: string;
  url?: string;
  icon_type?: string;
  description?: string | null;
  is_visible?: boolean;
  display_order?: number;
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
      // Auto-calculate display_order if not provided, otherwise shift existing items
      let displayOrder = data.display_order;
      if (displayOrder === undefined) {
        const maxResult = await queryFirst<{ max_order: number }>(
          'SELECT COALESCE(MAX(display_order), -1) as max_order FROM links WHERE section_id = ?',
          [data.section_id]
        );
        displayOrder = (maxResult?.max_order ?? -1) + 1;
      } else {
        await shiftDisplayOrdersForInsert({ table: 'links', displayOrder, sectionId: data.section_id });
      }

      const result = await execute(
        `INSERT INTO links (section_id, label, url, icon_type, description, is_visible, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.section_id,
          data.label,
          data.url,
          data.icon_type ?? 'auto',
          data.description ?? null,
          boolToInt(data.is_visible ?? true),
          displayOrder,
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

      // Moving to another section: append at its end and close the gap left behind
      const moving = data.section_id !== undefined && data.section_id !== existing.section_id;
      if (moving) {
        const maxResult = await queryFirst<{ max_order: number }>(
          'SELECT COALESCE(MAX(display_order), -1) as max_order FROM links WHERE section_id = ?',
          [data.section_id]
        );
        data = { ...data, display_order: (maxResult?.max_order ?? -1) + 1 };
      }

      // Handle display_order conflict within same section
      if (!moving && data.display_order !== undefined) {
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
          { field: 'description', column: 'description' },
          { field: 'section_id', column: 'section_id' },
          { field: 'is_visible', column: 'is_visible', transform: boolToInt },
          { field: 'display_order', column: 'display_order' },

        ],
      });

      if (fieldCount === 0) {
        return { success: false, error: 'No fields to update', status: 400 };
      }

      if (moving) {
        await execute(
          'UPDATE links SET display_order = display_order - 1, updated_at = CURRENT_TIMESTAMP WHERE section_id = ? AND display_order > ?',
          [existing.section_id, existing.display_order]
        );
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

      const deletedOrder = existing.display_order;
      const sectionId = existing.section_id;
      await execute('DELETE FROM links WHERE id = ?', [id]);
      await execute(
        'UPDATE links SET display_order = display_order - 1, updated_at = CURRENT_TIMESTAMP WHERE section_id = ? AND display_order > ?',
        [sectionId, deletedOrder]
      );
      return { success: true, data: { deleted: true } };
    } catch (error) {
      console.error('Error deleting link:', error);
      return { success: false, error: 'Failed to delete link', status: 500 };
    }
  },

  /**
   * Set display_order for the links of one section, in the given order
   */
  async reorder(ids: number[]): Promise<ServiceResult<{ reordered: number }>> {
    try {
      for (let i = 0; i < ids.length; i++) {
        await execute('UPDATE links SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [i, ids[i]]);
      }
      return { success: true, data: { reordered: ids.length } };
    } catch (error) {
      console.error('Error reordering links:', error);
      return { success: false, error: 'Failed to reorder links', status: 500 };
    }
  },

  /**
   * Track a link click (fire-and-forget operation): bump the all-time counter
   * and record one dated event for the dashboard.
   */
  async trackClick(id: number, source: string): Promise<void> {
    try {
      const link = await queryFirst<Pick<Link, 'id' | 'section_id'>>('SELECT id, section_id FROM links WHERE id = ?', [id]);
      if (!link) return;
      await execute('UPDATE links SET clicks = clicks + 1 WHERE id = ?', [id]);
      // fails quietly until migration 0008 is applied; the counter above still works
      await execute('INSERT INTO click_events (link_id, section_id, source, created_at) VALUES (?, ?, ?, ?)', [
        link.id,
        link.section_id,
        source,
        Date.now(),
      ]).catch((error) => console.error('Error recording click event:', error));
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
        'SELECT * FROM links WHERE section_id = ? AND is_visible = 1 ORDER BY display_order ASC',
        [sectionId]
      );
    } catch (error) {
      console.error('Error fetching links:', error);
      return [];
    }
  },

  /**
   * Count visible links per section in one query.
   * Used by the home page to label each section key.
   */
  async countVisibleBySection(): Promise<Record<number, number>> {
    try {
      const rows = await query<{ section_id: number; total: number }>(
        'SELECT section_id, COUNT(*) as total FROM links WHERE is_visible = 1 GROUP BY section_id'
      );
      return Object.fromEntries(rows.map((r) => [r.section_id, r.total]));
    } catch (error) {
      console.error('Error counting links:', error);
      return {};
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
