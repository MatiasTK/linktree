import { SettingsWorkspace } from '@/components/admin/SettingsWorkspace';
import { settingsService } from '@/services';

export const dynamic = 'force-dynamic';

const FALLBACK = {
  site_title: 'My Links',
  site_description: 'All my important links in one place',
  profile_initial: 'M',
  profile_image_url: '',
};

export default async function SettingsPage() {
  const result = await settingsService.getAll();
  return <SettingsWorkspace initialSettings={result.success ? result.data : FALLBACK} />;
}
