import { Deck, Keycap } from '@/components/keys';
import { linksService, sectionsService } from '@/services';
import type { Metadata } from 'next';
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

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default async function SectionPage({ params }: PageProps) {
  const { slug } = await params;
  const section = await sectionsService.getBySlug(slug);

  if (!section) {
    notFound();
  }

  const links = await linksService.getVisibleBySection(section.id);
  const description =
    section.description || `${links.length} link${links.length === 1 ? '' : 's'}`;

  return (
    <Deck
      title={section.title}
      description={description}
      path={
        <>
          <strong>matiastk</strong>
          <span>/ {section.slug}</span>
        </>
      }
      showHome
      shortcutCount={links.length}
      imageUrl={section.profile_image_url}
    >
      <nav className="board board--links" aria-label={`${section.title} links`}>
        {links.length === 0 ? (
          <p className="board__empty">No links in this section yet.</p>
        ) : (
          links.map((link, i) => (
            <Keycap
              key={link.id}
              index={i + 1}
              label={link.label}
              meta={hostOf(link.url)}
              icon={link.icon_type}
              href={link.url}
              external
              linkId={link.id}
              tone={i === 0 ? 'accent' : i === links.length - 1 && links.length >= 3 ? 'mod' : 'plain'}
            />
          ))
        )}
      </nav>
    </Deck>
  );
}
