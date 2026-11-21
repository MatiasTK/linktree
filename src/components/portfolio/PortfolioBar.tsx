import { SoundToggle } from '@/components/keys/SoundToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { type Lang, ui } from '@/content/portfolio';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface PortfolioBarProps {
  lang: Lang;
  /** where esc goes */
  homeHref: string;
  homeLabel: string;
  path: ReactNode;
  /** this page in the other language */
  switchHref: string;
  /** section navigation shown inside the bar */
  nav?: ReactNode;
}

export function PortfolioBar({ lang, homeHref, homeLabel, path, switchHref, nav }: PortfolioBarProps) {
  const other = lang === 'en' ? 'es' : 'en';
  return (
    <div className={nav ? 'deck__bar pf-bar pf-bar--sticky' : 'deck__bar pf-bar'}>
      <div className="flex items-center gap-3 min-w-0">
        <Link href={homeHref} className="keycap" data-key-home aria-keyshortcuts="Escape" aria-label={homeLabel}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden
          >
            <path d="M19 12H5m6-6-6 6 6 6" />
          </svg>
          <span className="hidden sm:inline">esc</span>
        </Link>
        <span className="truncate">{path}</span>
        {nav}
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={switchHref}
          className="keycap"
          hrefLang={other}
          lang={other}
          aria-label={ui.switchLang[lang]}
          title={ui.switchLang[lang]}
        >
          {other.toUpperCase()}
        </Link>
        <SoundToggle />
        <ThemeToggle />
      </div>
    </div>
  );
}
