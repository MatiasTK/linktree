import { DynamicIcon } from '@/components/icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { query } from '@/lib/db';
import type { Section, Settings } from '@/lib/types';
import Link from 'next/link';

// Force dynamic rendering for SSR
export const dynamic = 'force-dynamic';

interface SettingRow {
  key: string;
  value: string;
}

async function getSettings(): Promise<Settings> {
  try {
    const rows = await query<SettingRow>('SELECT key, value FROM settings');
    const settings: Settings = {
      site_title: 'My Links',
      site_description: 'All my important links in one place',
      profile_initial: 'M',
      profile_image_url: '',
    };
    for (const row of rows) {
      if (row.key in settings) {
        settings[row.key as keyof Settings] = row.value;
      }
    }
    return settings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {
      site_title: 'My Links',
      site_description: 'All my important links in one place',
      profile_initial: 'M',
      profile_image_url: '',
    };
  }
}

async function getSections(): Promise<Section[]> {
  try {
    const sections = await query<Section>(
      'SELECT * FROM sections WHERE show_in_main = 1 ORDER BY display_order ASC',
    );
    return sections;
  } catch (error) {
    console.error('Error fetching sections:', error);
    return [];
  }
}

export default async function HomePage() {
  const [settings, sections] = await Promise.all([getSettings(), getSections()]);

  return (
    <main className="min-h-screen py-12 px-4 relative">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          {settings.profile_image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={settings.profile_image_url}
              alt="Profile"
              className="w-24 h-24 mx-auto mb-4 rounded-full object-cover ring-4 ring-primary/20"
            />
          ) : (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-linear-to-br from-primary to-purple-500 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {settings.profile_initial || 'M'}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold gradient-text">{settings.site_title}</h1>
          <p className="text-muted-foreground mt-2">{settings.site_description}</p>
        </header>

        {/* Sections */}
        <div className="space-y-4">
          {sections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No sections available yet.</p>
              <Link href="/admin" className="text-primary hover:underline mt-2 inline-block">
                Add sections in the admin panel
              </Link>
            </div>
          ) : (
            sections.map((section) => (
              <Link
                key={section.id}
                href={`/${section.slug}`}
                className="link-card block p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DynamicIcon name="folder" className="text-primary" size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold">{section.title}</h2>
                    <p className="text-sm text-muted-foreground">/{section.slug}</p>
                  </div>
                  <DynamicIcon
                    name="chevron-right"
                    className="ml-auto text-muted-foreground"
                    size={20}
                  />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Powered by{' '}
            <a
              href="https://pages.cloudflare.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Cloudflare Pages
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
