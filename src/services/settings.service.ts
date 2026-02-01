import { execute, query } from '@/lib/db';
import type { Settings } from '@/lib/types';
import type { ServiceResult } from './base.service';

// ============================================================================
// Types
// ============================================================================

interface SettingRow {
  key: string;
  value: string;
}

const DEFAULT_SETTINGS: Settings = {
  site_title: 'My Links',
  site_description: 'All my important links in one place',
  profile_initial: 'M',
  profile_image_url: '',
};

// ============================================================================
// Settings Service
// ============================================================================

export const settingsService = {
  /**
   * Get all settings with defaults
   */
  async getAll(): Promise<ServiceResult<Settings>> {
    try {
      const rows = await query<SettingRow>('SELECT key, value FROM settings');
      const settings = { ...DEFAULT_SETTINGS };

      for (const row of rows) {
        if (row.key in settings) {
          settings[row.key as keyof Settings] = row.value;
        }
      }

      return { success: true, data: settings };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return { success: false, error: 'Failed to fetch settings', status: 500 };
    }
  },

  /**
   * Update settings (INSERT OR REPLACE for each key)
   */
  async update(data: Partial<Settings>): Promise<ServiceResult<Settings>> {
    try {
      // Update only provided fields
      for (const [key, value] of Object.entries(data)) {
        if (key in DEFAULT_SETTINGS) {
          await execute(
            'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
            [key, value ?? '']
          );
        }
      }

      // Return updated settings
      return this.getAll();
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error: 'Failed to update settings', status: 500 };
    }
  },
};
