import { defaultProfile, type PortfolioProfile } from '@/content/portfolio';
import { execute, queryFirst } from '@/lib/db';
import { sanitizeProfile } from '@/lib/portfolio-profile';
import { cache } from 'react';
import type { ServiceResult } from './base.service';

const KEY = 'portfolio_profile';

export const portfolioProfileService = {
  /** The saved profile, or the code default until the first save. Cached per request. */
  get: cache(async (): Promise<PortfolioProfile> => {
    try {
      const row = await queryFirst<{ value: string }>('SELECT value FROM settings WHERE key = ?', [KEY]);
      return row ? sanitizeProfile(JSON.parse(row.value)) : defaultProfile;
    } catch (error) {
      console.error('Error reading portfolio profile:', error);
      return defaultProfile;
    }
  }),

  async save(input: unknown): Promise<ServiceResult<PortfolioProfile>> {
    try {
      const profile = sanitizeProfile(input);
      await execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [KEY, JSON.stringify(profile)]);
      return { success: true, data: profile };
    } catch (error) {
      console.error('Error saving portfolio profile:', error);
      return { success: false, error: 'Failed to save the portfolio profile', status: 500 };
    }
  },
};
