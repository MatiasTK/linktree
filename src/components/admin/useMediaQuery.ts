'use client';

import { useSyncExternalStore } from 'react';

/** Live media query match; false during server render. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** The width at which the right pane is docked beside the list (see admin.css). */
export const DOCKED_QUERY = '(min-width: 1180px)';
