import { Icon } from '@/components/atoms';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

type KeyTone = 'plain' | 'accent' | 'mod';

interface KeycapProps {
  /** 1-based position; doubles as the keyboard shortcut when <= 9 */
  index: number;
  label: string;
  meta?: string;
  tone?: KeyTone;
  icon?: string;
  /** internal route (section) or external URL (link) */
  href: string;
  external?: boolean;
  /** link id for click tracking */
  linkId?: number;
}

function ArrowGlyph({ external }: { external?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      {external ? <path d="M7 17 17 7M9 7h8v8" /> : <path d="M5 12h14m-6-6 6 6-6 6" />}
    </svg>
  );
}

export function Keycap({ index, label, meta, tone = 'plain', icon, href, external, linkId }: KeycapProps) {
  const shortcut = index <= 9 ? String(index) : undefined;
  const className = cn(
    'key',
    tone === 'accent' && 'key--accent',
    tone === 'mod' && 'key--mod',
    external && 'key--link',
  );
  const style = { '--i': index - 1 } as CSSProperties;

  const cap: ReactNode = (
    <span className="key__cap">
      <span className="key__num" aria-hidden>
        {shortcut ?? '·'}
      </span>
      <span className="key__arrow">
        <ArrowGlyph external={external} />
      </span>
      <span className="key__body">
        {icon && (
          <span className="key__icon" aria-hidden>
            <Icon name={icon} size={20} />
          </span>
        )}
        <span className="key__text">
          <span className="key__label" title={label} data-long={label.length > 28 ? '' : undefined}>
            {label}
          </span>
          {meta && <span className="key__meta">{meta}</span>}
        </span>
      </span>
    </span>
  );

  const shared = {
    className,
    style,
    'data-key': shortcut,
    'data-key-href': href,
    'aria-keyshortcuts': shortcut,
  };

  if (external) {
    return (
      <a {...shared} href={href} target="_blank" rel="noopener noreferrer" data-link-id={linkId}>
        {cap}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link {...shared} href={href}>
      {cap}
    </Link>
  );
}
