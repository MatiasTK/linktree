'use client';

import { playKeySound, preloadKeySounds } from '@/lib/key-sound';
import { SWITCH_GROUPS } from '@/lib/switches';
import { type CSSProperties, useEffect, useRef } from 'react';

const GROUPS = SWITCH_GROUPS;
const ALL = GROUPS.flatMap((g) => g.switches);
const BY_LEGEND = new Map(ALL.map((s) => [s.legend, s]));

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function SwitchTester() {
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void preloadKeySounds(ALL.map((s) => s.sound));

    const keyFor = (legend: string) =>
      boardRef.current?.querySelector<HTMLElement>(`[data-legend="${legend}"]`) ?? null;

    const onDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      const legend = event.key.length === 1 ? event.key.toUpperCase() : '';

      if (event.key === ' ') {
        event.preventDefault(); // no page scroll while typing
        playKeySound('mod');
        return;
      }
      if (event.key === 'Enter') {
        playKeySound('accent');
        return;
      }

      const sw = BY_LEGEND.get(legend);
      if (sw) {
        event.preventDefault(); // digits must not trigger the board's number shortcuts
        const el = keyFor(legend);
        if (el) el.dataset.pressed = '';
        playKeySound(sw.sound);
      } else if (/^[A-Z]$/.test(legend)) {
        playKeySound('plain'); // any other letter still clicks
      }
    };

    const onUp = (event: KeyboardEvent) => {
      const legend = event.key.length === 1 ? event.key.toUpperCase() : '';
      const el = legend ? keyFor(legend) : null;
      if (el) delete el.dataset.pressed;
    };

    const release = () =>
      boardRef.current?.querySelectorAll<HTMLElement>('[data-pressed]').forEach((el) => delete el.dataset.pressed);

    document.addEventListener('keydown', onDown);
    document.addEventListener('keyup', onUp);
    window.addEventListener('blur', release);
    return () => {
      document.removeEventListener('keydown', onDown);
      document.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', release);
    };
  }, []);

  return (
    <div ref={boardRef} className="board board--tester" role="group" aria-label="Switch tester">
      {GROUPS.map((group) => (
        <div key={group.name} className="tester__row" role="group" aria-label={`${group.name} switches`}>
          <p className="tester__group">{group.name}</p>
          {group.switches.map((sw) => (
            <div key={sw.name} className="tester__cell">
              <button
                type="button"
                className="key key--tester"
                data-sound={sw.sound}
                data-legend={sw.legend}
                aria-label={`${sw.name} switch`}
                aria-keyshortcuts={sw.legend}
              >
                <span className="key__cap">
                  <span className="key__legend" aria-hidden>
                    {sw.legend}
                  </span>
                </span>
              </button>
              <p className="tester__label">
                <span className="tester__stem" style={{ '--stem': sw.stem } as CSSProperties} aria-hidden />
                <span>{sw.name}</span>
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
