/** Shared between the typing test (client) and the scores API (server). */

export type TypingMode = 'time' | 'words';
export type TypingLanguage = 'en' | 'es';

export const MODE_VALUES: Record<TypingMode, readonly number[]> = {
  time: [15, 30, 60],
  words: [10, 25, 50],
};

export const LANGUAGES: readonly TypingLanguage[] = ['en', 'es'];

export const NAME_MAX = 16;
/** letters (any script), digits, space, dot, dash, underscore */
export const NAME_PATTERN = /^[\p{L}\p{N} ._-]+$/u;

/** above this the score is not plausible for a human */
export const WPM_CEILING = 300;

export function isMode(v: unknown): v is TypingMode {
  return v === 'time' || v === 'words';
}

export function isLanguage(v: unknown): v is TypingLanguage {
  return v === 'en' || v === 'es';
}

export function isModeValue(mode: TypingMode, v: unknown): v is number {
  return typeof v === 'number' && MODE_VALUES[mode].includes(v);
}

/** WPM from correct characters (spaces of correct words included) over elapsed ms. */
export function wpmFrom(chars: number, ms: number): number {
  if (ms <= 0) return 0;
  return chars / 5 / (ms / 60000);
}
