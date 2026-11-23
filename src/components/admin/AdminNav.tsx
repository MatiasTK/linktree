'use client';

import { LogoutButton } from '@/components/LogoutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BarChart3, Briefcase, ExternalLink, Link2, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const AREAS = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
  { href: '/admin/links', label: 'Links', icon: Link2 },
  { href: '/admin/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/admin/settings', label: 'Settings', icon: SlidersHorizontal },
];

/** Narrow rail from 768px; a bottom tab bar on phones. */
export function AdminRail() {
  const pathname = usePathname();

  return (
    <aside className="adm-rail" aria-label="Admin">
      <Link href="/" className="adm-rail__brand" title="View site" aria-label="View site">
        M
      </Link>
      <nav className="adm-rail__nav">
        {AREAS.map(({ href, label, icon: Icon, exact }) => {
          const current = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="adm-rail__item" aria-current={current ? 'page' : undefined}>
              <Icon size={20} strokeWidth={2} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="adm-rail__foot">
        <a href="/" target="_blank" rel="noopener noreferrer" className="adm-tool" title="Open the site in a new tab">
          <ExternalLink size={18} aria-hidden />
          <span className="sr-only">Open the site in a new tab</span>
        </a>
        <ThemeToggle />
        <LogoutButton />
      </div>
    </aside>
  );
}

/** Phones only: the rail's footer actions, above the page. */
export function AdminTopbar() {
  return (
    <div className="adm-topbar">
      <span className="adm-topbar__path adm-mono">
        <strong>matiastk</strong> / admin
      </span>
      <div className="adm-topbar__actions">
        <a href="/" target="_blank" rel="noopener noreferrer" className="adm-tool" title="Open the site in a new tab">
          <ExternalLink size={18} aria-hidden />
          <span className="sr-only">Open the site in a new tab</span>
        </a>
        <ThemeToggle />
        <LogoutButton />
      </div>
    </div>
  );
}
