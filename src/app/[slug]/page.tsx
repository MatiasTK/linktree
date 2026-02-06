import { EmptyState } from '@/components/molecules';
import { LinkCard, ProfileHeader } from '@/components/organisms';
import { ThemeToggle } from '@/components/ThemeToggle';
import { linksService, sectionsService } from '@/services';
import { Code, Home } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
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

        <div className="space-y-3">
          {links.length === 0 ? (
            <EmptyState message="No links in this section yet." />
          ) : (
            links.map((link) => <LinkCard key={link.id} link={link} />)
          )}
        </div>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            Made by
            <Code size={16} className="text-primary" />
            <a
              href="https://github.com/MatiasTK"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              MatiasTK
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
