import { KeyboardNav } from '@/components/keys';
import { PortfolioBar } from '@/components/portfolio/PortfolioBar';
import { ExperienceSection, NowLine, SpecSheet } from '@/components/portfolio/ExperienceBlocks';
import { PortfolioNav } from '@/components/portfolio/PortfolioNav';
import { ScrollTopLink } from '@/components/portfolio/ScrollTopLink';
import { ProjectShot } from '@/components/portfolio/ProjectShot';
import { type Lang, langFrom, projectText, ui } from '@/content/portfolio';
import type { Project } from '@/lib/types';
import { portfolioProfileService, projectsService } from '@/services';
import { ArrowRight, ArrowUpRight, Code, Download, Github, Linkedin, Mail } from 'lucide-react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ lang?: string | string[] }>;
}

async function resolveLang(searchParams: PageProps['searchParams']): Promise<Lang> {
  const [{ lang }, h] = await Promise.all([searchParams, headers()]);
  return langFrom(lang, h.get('accept-language'));
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const profile = await portfolioProfileService.get();
  const lang = await resolveLang(searchParams);
  const title = `${profile.name} · Portfolio`;
  const description = profile.thesis[lang];
  return {
    title: { absolute: title },
    description,
    alternates: {
      languages: { en: '/portfolio?lang=en', es: '/portfolio?lang=es' },
    },
    openGraph: { title, description, type: 'profile' },
    twitter: { card: 'summary', title, description },
  };
}

function stackOf(project: Project) {
  return project.stack
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function ExternalLabel({ lang }: { lang: Lang }) {
  return <span className="sr-only"> {ui.openNewTab[lang]}</span>;
}

export default async function PortfolioPage({ searchParams }: PageProps) {
  const profile = await portfolioProfileService.get();
  const lang = await resolveLang(searchParams);
  const projects = await projectsService.getVisible();
  const navItems = [
    { id: 'experience', label: ui.experience[lang] },
    ...(projects.length > 0 ? [{ id: 'projects', label: ui.projects[lang] }] : []),
    { id: 'how-i-work', label: ui.howIWork[lang] },
    { id: 'stack', label: ui.stackAndEducation[lang] },
    { id: 'contact', label: profile.contact.title[lang] },
  ];
  const sectionNav = <PortfolioNav items={navItems} label={ui.sections[lang]} />;
  const q = `?lang=${lang}`;
  const [first, ...rest] = profile.name.split(' ');

  return (
    <main className="pf" lang={lang}>
      <KeyboardNav />
      <PortfolioBar
        lang={lang}
        homeHref="/"
        homeLabel={lang === 'en' ? 'Back to links' : 'Volver a los links'}
        path={
          <ScrollTopLink label={ui.backToTop[lang]}>
            <strong>matiastk</strong>
            <span>/ portfolio</span>
          </ScrollTopLink>
        }
        switchHref={`/portfolio?lang=${lang === 'en' ? 'es' : 'en'}`}
        nav={sectionNav}
      />
      <div className="pf-first">
        {/* first viewport: who, the spec sheet, how to reach me */}
        <section id="profile" tabIndex={-1} className="pf-hero" aria-labelledby="pf-name">
          <div className="pf-hero__id">
            <h1 id="pf-name" className="pf-name" tabIndex={-1}>
              {first}
              <br />
              {rest.join(' ')}
            </h1>
            <NowLine lang={lang} profile={profile} />
            <p className="pf-thesis">{profile.thesis[lang]}</p>
            <div className="pf-actions">
              <a className="key key--accent pf-act" href={`mailto:${profile.email}`}>
                <span className="key__cap">
                  <Mail size={18} aria-hidden className="pf-act__icon" />
                  <span className="pf-act__label">{ui.getInTouch[lang]}</span>
                  <ArrowRight size={18} aria-hidden className="pf-act__arrow" />
                </span>
              </a>
              <a className="key key--mod pf-act" href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                <span className="key__cap">
                  <Linkedin size={18} aria-hidden className="pf-act__icon" />
                  <span className="pf-act__label">LinkedIn</span>
                  <ArrowUpRight size={18} aria-hidden className="pf-act__arrow" />
                </span>
                <ExternalLabel lang={lang} />
              </a>
              <a className="key pf-act" href={profile.github} target="_blank" rel="noopener noreferrer">
                <span className="key__cap">
                  <Github size={18} aria-hidden className="pf-act__icon" />
                  <span className="pf-act__label">GitHub</span>
                  <ArrowUpRight size={18} aria-hidden className="pf-act__arrow" />
                </span>
                <ExternalLabel lang={lang} />
              </a>
              {profile.cvUrl && (
                <a className="key pf-act" href={profile.cvUrl} target="_blank" rel="noopener noreferrer">
                  <span className="key__cap">
                    <Download size={18} aria-hidden className="pf-act__icon" />
                    <span className="pf-act__label">{ui.downloadCv[lang]}</span>
                    <ArrowUpRight size={18} aria-hidden className="pf-act__arrow" />
                  </span>
                  <ExternalLabel lang={lang} />
                </a>
              )}
            </div>
          </div>
          <SpecSheet lang={lang} profile={profile} />
        </section>
      </div>

      <ExperienceSection lang={lang} profile={profile} />

      <section id="projects" tabIndex={-1} className="pf-section" aria-labelledby="pf-projects">
        <h2 id="pf-projects" className="pf-h2">
          {ui.selectedWork[lang]}
        </h2>
        {projects.length === 0 ? (
          <p className="board__empty">{ui.noProjects[lang]}</p>
        ) : (
          <div className="pf-projects">
            {projects.map((p, i) => (
              <article key={p.id} className="board pf-project" aria-labelledby={`pf-p-${p.slug}`}>
                <Link href={`/portfolio/${p.slug}${q}`} className="pf-project__shot" tabIndex={-1} aria-hidden>
                  <ProjectShot name={p.name} imageUrl={p.image_url} alt="" priority={i === 0} />
                </Link>
                <div className="pf-project__text">
                  <h3 id={`pf-p-${p.slug}`} className="pf-project__name">
                    <Link
                      href={`/portfolio/${p.slug}${q}`}
                      data-key={i < 9 ? String(i + 1) : undefined}
                      aria-keyshortcuts={i < 9 ? String(i + 1) : undefined}
                    >
                      {p.name}
                    </Link>
                  </h3>
                  <p className="pf-project__meta">
                    {projectText(p, 'kind', lang)}
                    {p.year && <> · {p.year}</>}
                  </p>
                  <p className="pf-project__summary">{projectText(p, 'summary', lang)}</p>
                  <ul className="pf-chips" aria-label={ui.stackLabel[lang]}>
                    {stackOf(p).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <div className="pf-project__links">
                    <Link href={`/portfolio/${p.slug}${q}`} className="keycap pf-pill">
                      {ui.caseStudy[lang]}
                      <ArrowRight size={15} aria-hidden />
                    </Link>
                    {p.site_url && (
                      <a href={p.site_url} target="_blank" rel="noopener noreferrer" className="keycap pf-pill">
                        {ui.visit[lang]}
                        <ArrowUpRight size={15} aria-hidden />
                        <ExternalLabel lang={lang} />
                      </a>
                    )}
                    {p.repo_url && (
                      <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="keycap pf-pill">
                        {ui.code[lang]}
                        <ArrowUpRight size={15} aria-hidden />
                        <ExternalLabel lang={lang} />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="how-i-work" tabIndex={-1} className="pf-section" aria-labelledby="pf-how">
        <h2 id="pf-how" className="pf-h2">
          {ui.howIWork[lang]}
        </h2>
        <div className="pf-how">
          {profile.howIWork.map((item) => (
            <div key={item.title.en}>
              <h3>{item.title[lang]}</h3>
              <p>{item.body[lang]}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="stack" tabIndex={-1} className="pf-section pf-split" aria-labelledby="pf-stack">
        <div>
          <h2 id="pf-stack" className="pf-h2">
            {ui.stack[lang]}
          </h2>
          <dl className="pf-stack">
            {profile.stack.map((group) => (
              <div key={group.label.en}>
                <dt>{group.label[lang]}</dt>
                <dd>{group.items.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="pf-h2">{ui.education[lang]}</h2>
          <ul className="pf-edu">
            <li>
              <strong>{profile.education.name[lang]}</strong>
              <span>{profile.education.school[lang]}</span>
            </li>
            {profile.credentials.map((c) => (
              <li key={c.name}>
                <strong>
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noopener noreferrer">
                      {c.name}
                      <ExternalLabel lang={lang} />
                    </a>
                  ) : (
                    c.name
                  )}
                </strong>
                <span>
                  {c.issuer} · {c.date[lang]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="contact" tabIndex={-1} className="board pf-contact" aria-labelledby="pf-contact">
        <div>
          <h2 id="pf-contact" className="pf-contact__title">
            {profile.contact.title[lang]}
          </h2>
          <p>{profile.contact.body[lang]}</p>
        </div>
        <a className="key key--accent pf-act pf-act--wide" href={`mailto:${profile.email}`}>
          <span className="key__cap">
            <Mail size={18} aria-hidden className="pf-act__icon" />
            <span className="pf-act__label">
              {profile.email.split('@')[0]}@<wbr />
              {profile.email.split('@')[1]}
            </span>
            <ArrowRight size={18} aria-hidden className="pf-act__arrow" />
          </span>
        </a>
      </section>

      <p className="deck__hint pf-hint">
        <span className="flex gap-2" aria-hidden>
          {projects.slice(0, 4).map((p, i) => (
            <span key={p.id} className="keycap">
              {i + 1}
            </span>
          ))}
        </span>
        {ui.pressHint[lang]}
      </p>

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
