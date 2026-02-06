import { EmptyState } from '@/components/molecules';
import { ProfileHeader, SectionCard } from '@/components/organisms';
import { ThemeToggle } from '@/components/ThemeToggle';
import { sectionsService, settingsService } from '@/services';
import { Code } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [settingsResult, sections] = await Promise.all([
    settingsService.getAll(),
    sectionsService.getVisible(),
  ]);

  const settings = settingsResult.success ? settingsResult.data : {
    site_title: 'My Links',
    site_description: 'All my important links in one place',
    profile_initial: 'M',
    profile_image_url: '',
  };

  return (
    <main className="min-h-screen py-12 px-4 relative">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-lg mx-auto">
        <ProfileHeader
          title={settings.site_title}
          description={settings.site_description}
          initial={settings.profile_initial || 'M'}
          imageUrl={settings.profile_image_url || undefined}
          size="lg"
        />

        <div className="space-y-4">
          {sections.length === 0 ? (
            <EmptyState
              message="No sections available yet."
              action={
                <Link href="/admin" className="text-primary hover:underline">
                  Add sections in the admin panel
                </Link>
              }
            />
          ) : (
            sections.map((section) => <SectionCard key={section.id} section={section} />)
          )}
        </div>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            Made by
            <a
              href="https://github.com/MatiasTK"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
            <Code size={16} className="text-primary" />
              MatiasTK
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
