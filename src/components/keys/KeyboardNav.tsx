'use client';

import { keySoundKindFor, playKeySound, preloadKeySounds } from '@/lib/key-sound';
import { useEffect } from 'react';

const VISITED_KEY = 'visited-keys';
const PRESS_MS = 90;

function readVisited(): string[] {
  try {
    const raw = localStorage.getItem(VISITED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function markVisited(href: string) {
  try {
    const list = readVisited().filter((h) => h !== href);
    list.unshift(href);
    localStorage.setItem(VISITED_KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    /* storage unavailable: the visited mark is only a convenience */
  }
}

const ENTRY_REFERRER_KEY = 'entry-referrer';

/** The referrer the visit started with, kept across internal navigation for the click's source. */
function entryReferrer(): string {
  try {
    const external = document.referrer && new URL(document.referrer).host !== location.host;
    if (external) sessionStorage.setItem(ENTRY_REFERRER_KEY, document.referrer);
    return sessionStorage.getItem(ENTRY_REFERRER_KEY) ?? '';
  } catch {
    return '';
  }
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Wires the keycap board:
 * - number keys 1–9 press the matching key, Escape presses the home key
 * - every key remembers it was visited (per viewer, local only)
 * - link keys report clicks to the click counter
 */
export function KeyboardNav() {
  useEffect(() => {
    const visited = new Set(readVisited());
    const ref = entryReferrer();
    // the admin's live preview frames these pages: its clicks are not traffic
    const framed = window.self !== window.top;
    document.querySelectorAll<HTMLElement>('[data-key-href]').forEach((el) => {
      if (visited.has(el.dataset.keyHref ?? '')) el.dataset.visited = '';
    });

    const onClick = (event: MouseEvent) => {
      const key = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-key-href]');
      if (!key) return;
      const href = key.dataset.keyHref;
      if (href) {
        markVisited(href);
        key.dataset.visited = '';
      }
      const linkId = key.dataset.linkId;
      if (linkId && !framed) navigator.sendBeacon?.(`/api/links/${linkId}/click`, JSON.stringify({ ref }));
    };

    const KEY_SELECTOR = '.key, .keycap';

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const key = (event.target as HTMLElement | null)?.closest(KEY_SELECTOR);
      if (key) playKeySound(keySoundKindFor(key));
    };

    // fetch the samples once the page has settled, so the first press is never silent
    const preload = () => void preloadKeySounds();
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(preload, { timeout: 2500 });
    } else {
      setTimeout(preload, 1200);
    }

    const press = (el: HTMLElement) => {
      playKeySound(keySoundKindFor(el));
      el.dataset.pressed = '';
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.setTimeout(
        () => {
          delete el.dataset.pressed;
          el.click();
        },
        reduce ? 0 : PRESS_MS,
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      if (event.key === 'Enter') {
        const key = (event.target as HTMLElement | null)?.closest?.(KEY_SELECTOR);
        if (key) playKeySound(keySoundKindFor(key));
        return;
      }

      if (event.key === 'Escape') {
        const home = document.querySelector<HTMLElement>('[data-key-home]');
        if (home) {
          event.preventDefault();
          press(home);
        }
        return;
      }

      if (/^[1-9]$/.test(event.key)) {
        const el = document.querySelector<HTMLElement>(`[data-key="${event.key}"]`);
        if (el) {
          event.preventDefault();
          press(el);
        }
      }
    };

    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return null;
}
