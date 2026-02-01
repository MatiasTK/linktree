import { EmptyState } from '@/components/molecules';
import { LinkCard, ProfileHeader } from '@/components/organisms';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Link as LinkType } from '@/lib/types';
import { linksService, sectionsService } from '@/services';
import { Home } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Group links by group_title
function groupLinks(links: LinkType[]) {
  const groups = new Map<string | null, LinkType[]>();

  for (const link of links) {
    const key = link.group_title;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(link);
  }

  return groups;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const section = await sectionsService.getBySlug(slug);

  if (!section) {
    return { title: 'Not Found' };
  }

  const description = section.description || `Links for ${section.title}`;

  return {
    title: section.title,
    description,
    openGraph: { title: section.title, description, type: 'website' },
    twitter: { card: 'summary', title: section.title, description },
  };
}

export default async function SectionPage({ params }: PageProps) {
  const { slug } = await params;
  const section = await sectionsService.getBySlug(slug);

  if (!section) {
    notFound();
  }

  const links = await linksService.getVisibleBySection(section.id);
  const groupedLinks = groupLinks(links);

  const profileInitial = section.profile_initial || section.title.charAt(0).toUpperCase();
  const description =
    section.description || `${links.length} link${links.length !== 1 ? 's' : ''} available`;

  return (
    <main className="min-h-screen py-12 px-4 relative">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 group"
          >
            <Home size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>

        <ProfileHeader
          title={section.title}
          description={description}
          initial={profileInitial}
          imageUrl={section.profile_image_url || undefined}
          size="md"
        />

        <div className="space-y-6">
          {links.length === 0 ? (
            <EmptyState message="No links in this section yet." />
          ) : (
            Array.from(groupedLinks.entries()).map(([groupTitle, groupLinks]) => (
              <div key={groupTitle ?? '__ungrouped__'}>
                {groupTitle && (
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                    {groupTitle}
                  </h2>
                )}
                <div className="space-y-3">
                  {groupLinks.map((link) => (
                    <LinkCard key={link.id} link={link} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

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
