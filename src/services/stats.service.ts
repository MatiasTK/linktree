import type { Link } from '@/lib/types';
import { sectionsService } from './sections.service';
import { linksService } from './links.service';

// ============================================================================
// Types
// ============================================================================

export interface DashboardStats {
  sectionsCount: number;
  linksCount: number;
  totalClicks: number;
  topLinks: Link[];
}

// ============================================================================
// Stats Service
// ============================================================================

export const statsService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [sections, links] = await Promise.all([
        sectionsService.getAll(),
        linksService.getAll(),
      ]);

      const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
      const topLinks = [...links].sort((a, b) => b.clicks - a.clicks).slice(0, 5);

      return {
        sectionsCount: sections.length,
        linksCount: links.length,
        totalClicks,
        topLinks,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        sectionsCount: 0,
        linksCount: 0,
        totalClicks: 0,
        topLinks: [],
      };
    }
  },
};
