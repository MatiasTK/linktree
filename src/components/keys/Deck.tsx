import { ThemeToggle } from '@/components/ThemeToggle';
import { Code, Gamepad2, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { KeyboardNav } from './KeyboardNav';
import { SoundToggle } from './SoundToggle';

interface DeckProps {
  title: string;
  description?: string | null;
  /** owner handle or path shown in the top bar */
  path: ReactNode;
  /** shows a home key in the top bar (section pages) */
  showHome?: boolean;
  /** number of keys with a shortcut, for the hint row */
  shortcutCount: number;
  imageUrl?: string | null;
  /** replaces the number-key hint (desktop only) */
  hint?: ReactNode;
  /** hide the switch-tester key (on the tester itself) */
  hideTesterLink?: boolean;
  /** hide the type-test key (on the test itself) */
  hideTypeLink?: boolean;
  /** one full-width column: intro on a single row, the board across the page */
  wide?: boolean;
  children: ReactNode;
}

const CREDIT_URL = 'https://github.com/MatiasTK';

export function Deck({
  title,
  description,
  path,
  showHome,
  shortcutCount,
  imageUrl,
  hint,
  hideTesterLink,
  hideTypeLink,
  wide,
  children,
}: DeckProps) {
  const hintKeys = Array.from({ length: Math.min(shortcutCount, 9) }, (_, i) => String(i + 1));

  return (
    <main className={cn('deck', wide && 'deck--wide')}>
      <KeyboardNav />

      <div className="deck__bar">
        <div className="flex items-center gap-3 min-w-0">
          {showHome && (
            <Link href="/" className="keycap" data-key-home aria-keyshortcuts="Escape" aria-label="Back to home">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="M19 12H5m6-6-6 6 6 6" />
              </svg>
              <span className="hidden sm:inline">esc</span>
            </Link>
          )}
          <span className="truncate">{path}</span>
        </div>
        <div className="flex items-center gap-2">
          {!hideTypeLink && (
            <Link href="/type" className="keycap" aria-label="Type test: how fast do you type?" title="Type test">
              <Gamepad2 className="w-4 h-4" aria-hidden />
            </Link>
          )}
          {!hideTesterLink && (
            <Link href="/keys" className="keycap" aria-label="Switch tester: keys that only make sound" title="Switch tester">
              <Keyboard className="w-4 h-4" aria-hidden />
            </Link>
          )}
          <SoundToggle />
          <ThemeToggle />
        </div>
      </div>

      <header className="deck__intro">
        {imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt=""
            width={72}
            height={72}
            className="mb-6 size-16 lg:size-[72px] rounded-2xl object-cover shadow-[0_3px_0_var(--key-skirt),0_8px_18px_-6px_rgba(0,0,0,0.25)]"
          />
        )}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </header>

      <div className="deck__board">{children}</div>

      {hint ? (
        <p className="deck__hint">{hint}</p>
      ) : hintKeys.length > 0 && (
        <p className="deck__hint">
          <span className="flex gap-2" aria-hidden>
            {hintKeys.slice(0, 4).map((k) => (
              <span key={k} className="keycap">
                {k}
              </span>
            ))}
            {hintKeys.length > 4 && <span className="self-center">…</span>}
          </span>
          {showHome ? 'press a number to open, esc to go back' : 'press a number or click a key'}
        </p>
      )}

      <footer className="deck__footer">
        Made by
        <a href={CREDIT_URL} target="_blank" rel="noopener noreferrer">
          <Code size={15} aria-hidden />
          MatiasTK
        </a>
      </footer>
    </main>
  );
}
