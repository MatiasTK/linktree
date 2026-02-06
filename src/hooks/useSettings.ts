'use client';

import { useToast } from '@/components/Toast';
import type { ApiResponse, Settings } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';

interface UseSettingsReturn {
  settings: Settings;
  loading: boolean;
  saving: boolean;
  updateSettings: (newSettings: Settings) => void;
  saveSettings: () => Promise<boolean>;
}

const defaultSettings: Settings = {
  site_title: 'My Links',
  site_description: 'All my important links in one place',
  profile_initial: 'M',
  profile_image_url: '',
};

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data: ApiResponse<Settings> = await res.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
  }, []);

  const saveSettings = useCallback(async (): Promise<boolean> => {
    setSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data: ApiResponse<Settings> = await res.json();

      if (data.success) {
        toast.success('Settings saved successfully!');
        return true;
      } else {
        toast.error(data.error || 'Failed to save settings');
        return false;
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
      return false;
    } finally {
      setSaving(false);
    }
  }, [settings, toast]);

  return {
    settings,
    loading,
    saving,
    updateSettings,
    saveSettings,
  };
}
