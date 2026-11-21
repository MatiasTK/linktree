import { KeyboardNav, Keycap } from '@/components/keys';
import { PortfolioBar } from '@/components/portfolio/PortfolioBar';
import { ProjectBody } from '@/components/portfolio/ProjectBody';
import { ProjectShot } from '@/components/portfolio/ProjectShot';
import { type Lang, langFrom, profile, projectText, ui } from '@/content/portfolio';
import { projectsService } from '@/services';
import { ArrowUpRight, Code } from 'lucide-react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string | string[] }>;
}

async function resolveLang(searchParams: PageProps['searchParams']): Promise<Lang> {
  const [{ lang }, h] = await Promise.all([searchParams, headers()]);
  return langFrom(lang, h.get('accept-language'));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ slug }, lang] = await Promise.all([params, resolveLang(searchParams)]);
  const project = await projectsService.getVisibleBySlug(slug);
  if (!project) return { title: 'Not Found' };

  const title = `${project.name} · ${profile.name}`;
  const description = projectText(project, 'summary', lang);
  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      ...(project.image_url ? { images: [project.image_url] } : {}),
    },
    twitter: { card: project.image_url ? 'summary_large_image' : 'summary', title, description },
  };
}

function hostOf(url: string) {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, '') + u.pathname).replace(/\/$/, '');
  } catch {
    return url;
  }
}

export default async function ProjectPage({ params, searchParams }: PageProps) {
  const [{ slug }, lang] = await Promise.all([params, resolveLang(searchParams)]);
  const [project, all] = await Promise.all([
    projectsService.getVisibleBySlug(slug),
    projectsService.getVisible(),
  ]);
  if (!project) notFound();

  const q = `?lang=${lang}`;
  const position = all.findIndex((p) => p.id === project.id);
  const nextIndex = all.length > 1 ? (position + 1) % all.length : -1;
  const next = nextIndex >= 0 ? all[nextIndex] : null;
  const stack = project.stack
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <main className="pf pf--case" lang={lang}>
      <KeyboardNav />
      <PortfolioBar
        lang={lang}
        homeHref={`/portfolio${q}`}
        homeLabel={ui.backToPortfolio[lang]}
        path={
          <>
            <strong>matiastk</strong>
            <span className="pf-crumb"> / portfolio</span> / {project.slug}
          </>
        }
        switchHref={`/portfolio/${project.slug}?lang=${lang === 'en' ? 'es' : 'en'}`}
      />

      <section className="pf-hero pf-hero--case" aria-labelledby="pf-case-name">
        <div className="pf-hero__id">
          <h1 id="pf-case-name" className="pf-name pf-name--case">
            {project.name}
          </h1>
          <p className="pf-thesis">{projectText(project, 'summary', lang)}</p>
        </div>

        <aside className="board pf-spec" aria-label={ui.specSheet[lang]}>
          <div className="pf-sheet">
            <dl>
              <div className="pf-sheet__row">
                <dt>{ui.type[lang]}</dt>
                <dd>{projectText(project, 'kind', lang)}</dd>
              </div>
              {project.year && (
                <div className="pf-sheet__row">
                  <dt>{ui.year[lang]}</dt>
                  <dd>{project.year}</dd>
                </div>
              )}
              {stack.length > 0 && (
                <div className="pf-sheet__row">
                  <dt>{ui.stackLabel[lang]}</dt>
                  <dd>{stack.join(', ')}</dd>
                </div>
              )}
              {(project.site_url || project.repo_url) && (
                <div className="pf-sheet__row">
                  <dt>{ui.links[lang]}</dt>
                  <dd className="pf-sheet__links">
                    {project.site_url && (
                      <a href={project.site_url} target="_blank" rel="noopener noreferrer">
                        {hostOf(project.site_url)}
                        <ArrowUpRight size={15} aria-hidden />
                        <span className="sr-only"> {ui.openNewTab[lang]}</span>
                      </a>
                    )}
                    {project.repo_url && (
                      <a href={project.repo_url} target="_blank" rel="noopener noreferrer">
                        {hostOf(project.repo_url)}
                        <ArrowUpRight size={15} aria-hidden />
                        <span className="sr-only"> {ui.openNewTab[lang]}</span>
                      </a>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </section>

      {project.image_url && (
        <div className="board pf-case-shot">
          <ProjectShot
            name={project.name}
            imageUrl={project.image_url}
            alt={lang === 'en' ? `${project.name} screenshot` : `Captura de ${project.name}`}
            priority
          />
        </div>
      )}

      <section className="pf-section pf-case-body" aria-label={project.name}>
        <ProjectBody text={projectText(project, 'body', lang)} />
      </section>

      {next && (
        <nav className="pf-next" aria-label={ui.nextProject[lang]}>
          <h2 className="pf-label">{ui.nextProject[lang]}</h2>
          <div className="board pf-strip__board pf-next__board">
            <Keycap
              index={nextIndex + 1}
              label={next.name}
              meta={projectText(next, 'kind', lang)}
              href={`/portfolio/${next.slug}${q}`}
              className="pf-strip__key"
            />
          </div>
        </nav>
      )}

      <footer className="deck__footer pf-footer">
        Made by
        <a href={profile.github} target="_blank" rel="noopener noreferrer">
          <Code size={15} aria-hidden />
          MatiasTK
        </a>
      </footer>
    </main>
  );
}
