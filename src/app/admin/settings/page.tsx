'use client';

import { Button, Input, LoadingPage } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { AdminPageTemplate } from '@/components/templates';
import { useSettings } from '@/hooks';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const { settings, loading, saving, updateSettings, saveSettings } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings();
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <AdminPageTemplate title="Site Settings">
      <div className="bg-card rounded-xl border border-border p-6 max-w-lg">
        <p className="text-muted-foreground mb-6">
          Configure the homepage profile and site-wide settings.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Site Title" required>
            <Input
              type="text"
              value={settings.site_title}
              onChange={(e) => updateSettings({ ...settings, site_title: e.target.value })}
              placeholder="My Links"
              required
            />
          </FormField>

          <FormField label="Site Description" required>
            <Input
              type="text"
              value={settings.site_description}
              onChange={(e) => updateSettings({ ...settings, site_description: e.target.value })}
              placeholder="All my important links in one place"
              required
            />
          </FormField>

          <FormField label="Profile Initial" hint="Shown when no profile image is set">
            <Input
              type="text"
              value={settings.profile_initial}
              onChange={(e) =>
                updateSettings({ ...settings, profile_initial: e.target.value.charAt(0) })
              }
              placeholder="M"
              maxLength={1}
            />
          </FormField>

          <FormField label="Profile Image URL" hint="Leave empty to show profile initial">
            <Input
              type="url"
              value={settings.profile_image_url}
              onChange={(e) => updateSettings({ ...settings, profile_image_url: e.target.value })}
              placeholder="https://..."
            />
          </FormField>

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
            <Button type="submit" className="w-full" isLoading={saving}>
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </AdminPageTemplate>
  );
}
