'use client';

import type { ErrorSound, KeySound } from '@/lib/key-sound';
import { switchBySound } from '@/lib/switches';
import { MODE_VALUES, isLanguage, isMode, type TypingLanguage, type TypingMode } from '@/lib/typing/config';
import { useCallback, useEffect, useState } from 'react';

export interface TypeSettings {
  mode: TypingMode;
  value: number;
  language: TypingLanguage;
  sound: KeySound;
  volume: number;
  errorSound: ErrorSound;
}

export const DEFAULT_SETTINGS: TypeSettings = {
  mode: 'time',
  value: 30,
  language: 'en',
  sound: 'plain',
  volume: 0.8,
  errorSound: 'thud',
};

const STORAGE_KEY = 'type-settings';

function read(): TypeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const p = JSON.parse(raw) as Partial<TypeSettings>;
    const mode = isMode(p.mode) ? p.mode : DEFAULT_SETTINGS.mode;
    const value = typeof p.value === 'number' && MODE_VALUES[mode].includes(p.value) ? p.value : MODE_VALUES[mode][1];
    return {
      mode,
      value,
      language: isLanguage(p.language) ? p.language : DEFAULT_SETTINGS.language,
      sound: p.sound && switchBySound(p.sound) ? p.sound : DEFAULT_SETTINGS.sound,
      volume: typeof p.volume === 'number' ? Math.min(1, Math.max(0, p.volume)) : DEFAULT_SETTINGS.volume,
      errorSound: p.errorSound === 'off' || p.errorSound === 'buzz' || p.errorSound === 'thud' ? p.errorSound : 'thud',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Per-viewer test and sound preferences, kept in this browser only. */
export function useTypeSettings() {
  const [settings, setSettings] = useState<TypeSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(read());
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<TypeSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (patch.mode && patch.mode !== prev.mode && patch.value === undefined) {
        next.value = MODE_VALUES[patch.mode][1];
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: settings last for this visit */
      }
      return next;
    });
  }, []);

  return { settings, update, ready };
}
