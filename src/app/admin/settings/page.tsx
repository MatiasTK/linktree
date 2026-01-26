'use client';

import type { ApiResponse, Settings } from '@/lib/types';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    site_title: 'My Links',
    site_description: 'All my important links in one place',
    profile_initial: 'M',
    profile_image_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data: ApiResponse<Settings> = await res.json();

      if (data.success) {
        alert('Settings saved successfully!');
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Site Settings</h1>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 max-w-lg">
        <p className="text-muted-foreground mb-6">
          Configure the homepage profile and site-wide settings.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Site Title</label>
            <input
              type="text"
              value={settings.site_title}
              onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
              className="input"
              placeholder="My Links"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Site Description</label>
            <input
              type="text"
              value={settings.site_description}
              onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
              className="input"
              placeholder="All my important links in one place"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Profile Initial</label>
            <input
              type="text"
              value={settings.profile_initial}
              onChange={(e) =>
                setSettings({ ...settings, profile_initial: e.target.value.charAt(0) })
              }
              className="input"
              placeholder="M"
              maxLength={1}
            />
            <p className="text-xs text-muted-foreground mt-1">Shown when no profile image is set</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Profile Image URL</label>
            <input
              type="url"
              value={settings.profile_image_url}
              onChange={(e) => setSettings({ ...settings, profile_image_url: e.target.value })}
              className="input"
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to show profile initial
            </p>
          </div>

          {settings.profile_image_url && (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.profile_image_url}
                alt="Preview"
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-sm text-muted-foreground">Image preview</span>
            </div>
          )}

          <div className="pt-4">
            <button type="submit" className="btn btn-primary w-full" disabled={saving}>
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
