'use client';

import type { ReactNode } from 'react';

/** The bar's path: back to the top of this page, like a site name in a header. `label` is read after the visible text. */
export function ScrollTopLink({ children, label }: { children: ReactNode; label: string }) {
  return (
    <a
      href="#profile"
      className="pf-bar__top"
      onClick={(e) => {
        e.preventDefault();
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        history.replaceState(null, '', window.location.pathname + window.location.search);
        document.getElementById('pf-name')?.focus({ preventScroll: true });
      }}
    >
      {children}
      <span className="sr-only">, {label}</span>
    </a>
  );
}
