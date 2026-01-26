import { ThemeToggle } from '@/components/ThemeToggle';
import { query, queryFirst } from '@/lib/db';
import type { Link as LinkType, Section } from '@/lib/types';
import { Home } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LinkCard } from './link-card';

// Force dynamic for SSR with D1
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getSection(slug: string): Promise<Section | null> {
  try {
    return await queryFirst<Section>('SELECT * FROM sections WHERE slug = ?', [slug]);
  } catch (error) {
    console.error('Error fetching section:', error);
    return null;
  }
}

async function getLinks(sectionId: number): Promise<LinkType[]> {
  try {
    return await query<LinkType>(
      'SELECT * FROM links WHERE section_id = ? AND is_visible = 1 ORDER BY group_order ASC, display_order ASC',
      [sectionId],
    );
  } catch (error) {
    console.error('Error fetching links:', error);
    return [];
  }
}

// Group links by group_title
function groupLinks(links: LinkType[]): Map<string | null, LinkType[]> {
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

// Dynamic SEO metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const section = await getSection(slug);

  if (!section) {
    return {
      title: 'Not Found',
    };
  }

  const description = section.description || `Links for ${section.title}`;

  return {
    title: section.title,
    description,
    openGraph: {
      title: section.title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: section.title,
      description,
    },
  };
}

export default async function SectionPage({ params }: PageProps) {
  const { slug } = await params;
  const section = await getSection(slug);

  if (!section) {
    notFound();
  }

  const links = await getLinks(section.id);
  const groupedLinks = groupLinks(links);

  // Use section profile or fall back to title initial
  const profileInitial = section.profile_initial || section.title.charAt(0).toUpperCase();
  const profileImage = section.profile_image_url;
  const description =
    section.description || `${links.length} link${links.length !== 1 ? 's' : ''} available`;

  return (
    <main className="min-h-screen py-12 px-4 relative">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          {/* Improved Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 group"
          >
            <Home size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          {/* Profile */}
          {profileImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profileImage}
              alt={section.title}
              className="w-20 h-20 mx-auto mb-4 rounded-full object-cover ring-4 ring-primary/20"
            />
          ) : (
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-linear-to-br from-primary to-purple-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{profileInitial}</span>
            </div>
          )}

          <h1 className="text-2xl font-bold gradient-text">{section.title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </header>

        {/* Links grouped by group_title */}
        <div className="space-y-6">
          {links.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No links in this section yet.</p>
            </div>
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
