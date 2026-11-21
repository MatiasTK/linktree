'use client';

import { type ErrorSound, isKeySoundOn, playErrorSound, playKeySound, setKeySoundOn } from '@/lib/key-sound';
import { SWITCH_GROUPS, switchBySound } from '@/lib/switches';
import { ChevronDown } from 'lucide-react';
import { type CSSProperties, useEffect, useId, useRef, useState } from 'react';
import type { TypeSettings } from './useTypeSettings';

interface SoundPanelProps {
  settings: TypeSettings;
  onChange: (patch: Partial<TypeSettings>) => void;
  disabled?: boolean;
}

const ERROR_SOUNDS: { value: ErrorSound; label: string }[] = [
  { value: 'thud', label: 'thud' },
  { value: 'buzz', label: 'buzz' },
  { value: 'off', label: 'off' },
];

function Stem({ color }: { color: string }) {
  return <span className="tester__stem" style={{ '--stem': color } as CSSProperties} aria-hidden />;
}

/** The switch picker: which recorded switch plays, how loud, and what a miss sounds like. */
export function SoundPanel({ settings, onChange, disabled }: SoundPanelProps) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const current = switchBySound(settings.sound);

  useEffect(() => {
    if (!open) return;
    setMuted(!isKeySoundOn());
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <div ref={wrapRef} className="sp">
      <button
        ref={triggerRef}
        type="button"
        className="keycap tf__switch"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        data-sound={settings.sound}
      >
        {current && <Stem color={current.stem} />}
        <span className="tf__switch-name">{current?.name ?? 'Switch'}</span>
        <ChevronDown className="size-4" aria-hidden />
      </button>

      {open && (
        <div id={panelId} className="sp__panel" role="dialog" aria-label="Key sound">
          {muted && (
            <p className="sp__muted">
              Key sound is muted.
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setKeySoundOn(true);
                  setMuted(false);
                  playKeySound(settings.sound, { volume: settings.volume });
                }}
              >
                Turn on
              </button>
            </p>
          )}

          <div role="radiogroup" aria-label="Switch" className="sp__groups">
            {SWITCH_GROUPS.map((g) => (
              <div key={g.name} className="sp__group">
                <p className="sp__label">{g.name}</p>
                {g.switches.map((sw) => {
                  const checked = sw.sound === settings.sound;
                  return (
                    <button
                      key={sw.sound}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      className="sp__option"
                      data-sound={sw.sound}
                      onClick={() => {
                        onChange({ sound: sw.sound });
                        playKeySound(sw.sound, { volume: settings.volume });
                      }}
                    >
                      <Stem color={sw.stem} />
                      <span>{sw.name}</span>
                      <span className="led" data-on={checked || undefined} aria-hidden />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="sp__row">
            <label htmlFor={`${panelId}-vol`} className="sp__label">
              Volume
            </label>
            <input
              id={`${panelId}-vol`}
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(settings.volume * 100)}
              onChange={(e) => onChange({ volume: Number(e.target.value) / 100 })}
              onPointerUp={() => playKeySound(settings.sound, { volume: settings.volume })}
              onKeyUp={() => playKeySound(settings.sound, { volume: settings.volume })}
              className="range"
              style={{ '--fill': `${Math.round(settings.volume * 100)}%` } as CSSProperties}
            />
            <span className="sp__value">{Math.round(settings.volume * 100)}%</span>
          </div>

          <div className="sp__row">
            <span className="sp__label" id={`${panelId}-err`}>
              Miss
            </span>
            <div role="radiogroup" aria-labelledby={`${panelId}-err`} className="flex gap-2">
              {ERROR_SOUNDS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={settings.errorSound === o.value}
                  className="keycap tf__opt"
                  data-sound={settings.sound}
                  onClick={() => {
                    onChange({ errorSound: o.value });
                    playErrorSound(o.value, settings.sound, settings.volume);
                  }}
                >
                  <span className="led" data-on={settings.errorSound === o.value || undefined} aria-hidden />
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
