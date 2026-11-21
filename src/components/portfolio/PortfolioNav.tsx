'use client';

import { useEffect, useState } from 'react';

export interface NavItem {
  id: string;
  label: string;
}

/** Tracks which section is being read: the last one whose top has passed 40% of the viewport. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      document.documentElement.toggleAttribute('data-pf-scrolled', window.scrollY > 8);
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) {
        setActive(ids[ids.length - 1] ?? null);
        return;
      }
      const line = window.innerHeight * 0.4;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      document.documentElement.removeAttribute('data-pf-scrolled');
    };
  }, [ids]);

  return active;
}

/** Scroll to a section's layout position (minus its scroll margin) and put its hash in the URL. */
function travel(id: string) {
  const target = document.getElementById(id);
  if (!target) return false;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let top = 0;
  for (let el: HTMLElement | null = target; el; el = el.offsetParent as HTMLElement | null) top += el.offsetTop;
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  window.scrollTo({ top: top - margin, behavior: reduce ? 'auto' : 'smooth' });
  history.replaceState(null, '', `#${id}`);
  target.focus({ preventScroll: true });
  return true;
}

/**
 * Section links in the sticky top bar (desktop). The section being read is set in full ink
 * with an orange underline; a click travels to the section and puts its hash in the URL.
 */
export function PortfolioNav({ items, label }: { items: NavItem[]; label: string }) {
  const [ids] = useState(() => items.map((i) => i.id));
  const active = useActiveSection(ids);

  return (
    <nav className="pf-nav" aria-label={label}>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="pf-nav__link"
              aria-current={item.id === active ? 'location' : undefined}
              onClick={(e) => {
                if (travel(item.id)) e.preventDefault();
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
