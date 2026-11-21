import { execute, query, queryFirst } from '@/lib/db';
import type { Project } from '@/lib/types';
import type { ProjectInput } from '@/lib/validation';
import { type ServiceResult, boolToInt } from './base.service';

const COLUMNS = [
  'slug',
  'name',
  'year',
  'kind_en',
  'kind_es',
  'summary_en',
  'summary_es',
  'body_en',
  'body_es',
  'stack',
  'image_url',
  'site_url',
  'repo_url',
] as const;

function toRow(data: ProjectInput): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const column of COLUMNS) {
    if (data[column] !== undefined) row[column] = data[column];
  }
  if (data.is_visible !== undefined) row.is_visible = boolToInt(data.is_visible);
  if (data.display_order !== undefined) row.display_order = data.display_order;
  return row;
}

export const projectsService = {
  async findAll(): Promise<ServiceResult<Project[]>> {
    try {
      const projects = await query<Project>('SELECT * FROM projects ORDER BY display_order ASC, id ASC');
      return { success: true, data: projects };
    } catch (error) {
      console.error('Error fetching projects:', error);
      return { success: false, error: 'Failed to fetch projects', status: 500 };
    }
  },

  async create(data: ProjectInput): Promise<ServiceResult<Project>> {
    try {
      if (!data.slug || !data.name) {
        return { success: false, error: 'Name and slug are required', status: 400 };
      }
      const existing = await queryFirst<{ id: number }>('SELECT id FROM projects WHERE slug = ?', [data.slug]);
      if (existing) {
        return { success: false, error: 'A project with this slug already exists', status: 400 };
      }

      const max = await queryFirst<{ max_order: number }>(
        'SELECT COALESCE(MAX(display_order), -1) as max_order FROM projects',
      );
      const row = toRow({ is_visible: true, ...data });
      row.display_order = (max?.max_order ?? -1) + 1;

      const columns = Object.keys(row);
      const result = await execute(
        `INSERT INTO projects (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
        Object.values(row),
      );
      const created = await queryFirst<Project>('SELECT * FROM projects WHERE id = ?', [result.meta.last_row_id]);
      return { success: true, data: created! };
    } catch (error) {
      console.error('Error creating project:', error);
      return { success: false, error: 'Failed to create project', status: 500 };
    }
  },

  async update(id: number, data: ProjectInput): Promise<ServiceResult<Project>> {
    try {
      const existing = await queryFirst<Project>('SELECT * FROM projects WHERE id = ?', [id]);
      if (!existing) {
        return { success: false, error: 'Project not found', status: 404 };
      }
      if (data.slug && data.slug !== existing.slug) {
        const clash = await queryFirst<{ id: number }>('SELECT id FROM projects WHERE slug = ? AND id != ?', [
          data.slug,
          id,
        ]);
        if (clash) return { success: false, error: 'A project with this slug already exists', status: 400 };
      }

      const row = toRow(data);
      const columns = Object.keys(row);
      if (columns.length > 0) {
        await execute(
          `UPDATE projects SET ${columns.map((c) => `${c} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [...Object.values(row), id],
        );
      }
      const updated = await queryFirst<Project>('SELECT * FROM projects WHERE id = ?', [id]);
      return { success: true, data: updated! };
    } catch (error) {
      console.error('Error updating project:', error);
      return { success: false, error: 'Failed to update project', status: 500 };
    }
  },

  async delete(id: number): Promise<ServiceResult<{ deleted: boolean }>> {
    try {
      const result = await execute('DELETE FROM projects WHERE id = ?', [id]);
      if (result.meta.changes === 0) {
        return { success: false, error: 'Project not found', status: 404 };
      }
      return { success: true, data: { deleted: true } };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { success: false, error: 'Failed to delete project', status: 500 };
    }
  },

  /** Rewrite display_order to match the given id order. */
  async reorder(ids: number[]): Promise<ServiceResult<{ reordered: number }>> {
    try {
      for (let i = 0; i < ids.length; i++) {
        await execute('UPDATE projects SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
          i,
          ids[i],
        ]);
      }
      return { success: true, data: { reordered: ids.length } };
    } catch (error) {
      console.error('Error reordering projects:', error);
      return { success: false, error: 'Failed to reorder projects', status: 500 };
    }
  },

  /** Public pages: visible projects, newest year first; empty on error (e.g. migration not applied yet). */
  async getVisible(): Promise<Project[]> {
    try {
      // newest first; the admin order breaks ties within a year
      return await query<Project>(
        "SELECT * FROM projects WHERE is_visible = 1 ORDER BY COALESCE(year, '') DESC, display_order ASC, id ASC",
      );
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },

  async getVisibleBySlug(slug: string): Promise<Project | null> {
    try {
      return await queryFirst<Project>('SELECT * FROM projects WHERE slug = ? AND is_visible = 1', [slug]);
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  },
};
