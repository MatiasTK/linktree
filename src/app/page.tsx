import { Deck, Keycap } from '@/components/keys';
import { linksService, sectionsService, settingsService } from '@/services';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function linkCount(n: number | undefined) {
  const total = n ?? 0;
  return `${total} link${total === 1 ? '' : 's'}`;
}

export default async function HomePage() {
  const [settingsResult, sections, counts] = await Promise.all([
    settingsService.getAll(),
    sectionsService.getVisible(),
    linksService.countVisibleBySection(),
  ]);

  const settings = settingsResult.success
    ? settingsResult.data
    : {
        site_title: 'My Links',
        site_description: 'All my important links in one place',
        profile_initial: 'M',
        profile_image_url: '',
      };

  const last = sections.length - 1;

  return (
    <Deck
      title={settings.site_title}
      description={settings.site_description}
      path={
        <>
          <strong>matiastk</strong>
          <span>/ links</span>
        </>
      }
      shortcutCount={sections.length}
      imageUrl={settings.profile_image_url || null}
    >
      <nav className="board" aria-label="Sections">
        {sections.length === 0 ? (
          <p className="board__empty">
            No sections yet. <Link href="/admin">Add one in the admin panel</Link>.
          </p>
        ) : (
          sections.map((section, i) => (
            <Keycap
              key={section.id}
              index={i + 1}
              label={section.title}
              meta={linkCount(counts[section.id])}
              href={`/${section.slug}`}
              tone={i === 0 ? 'accent' : i === last && last >= 2 ? 'mod' : 'plain'}
            />
          ))
        )}
      </nav>
    </Deck>
  );
}
