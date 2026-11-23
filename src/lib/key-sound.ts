'use client';

/**
 * Recorded mechanical key sounds, one switch per key type.
 * Samples come from Monkeytype (GPL-3.0), see public/sounds/ATTRIBUTION.txt.
 *
 * - plain  (white keys):          Cherry MX Blue PBT, the classic click
 * - accent (orange primary key):  Kailh Box White, crisper and sharper
 * - mod    (charcoal modifier):   Cherry MX Black PBT, linear, deeper thud
 * - small  (esc, theme, sound):   NK Creams, lighter
 *
 * The switch tester and speed typing add nine more sets (TesterSound), fetched only there.
 * Buffers are fetched once, after the page is idle, and shared across pages.
 */

/** The four sets every page uses, one per key type. */
export type KeySoundKind = 'plain' | 'accent' | 'mod' | 'small';

/** Extra sets, loaded only by the switch tester. Folder names under /public/sounds. */
export type TesterSound =
  | 'blue-abs'
  | 'black-abs'
  | 'brown-pbt'
  | 'razer-green'
  | 'tealios-v2'
  | 'akko-lavender'
  | 'typewriter'
  | 'rubber-dome'
  | 'trust-gxt';

export type KeySound = KeySoundKind | TesterSound;

const KINDS: KeySoundKind[] = ['plain', 'accent', 'mod', 'small'];
const VARIANTS = 5;
const DEFAULT_GAIN = 0.7;
const GAIN: Partial<Record<KeySound, number>> = { accent: 0.75, mod: 0.8, small: 0.55 };
const STORAGE_KEY = 'key-sound';

let ctx: AudioContext | null = null;
const buffers: Partial<Record<KeySound, AudioBuffer[]>> = {};
const loading = new Map<KeySound, Promise<void>>();

export function isKeySoundOn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setKeySoundOn(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* storage unavailable: the preference lasts for this page only */
  }
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  return ctx;
}

function loadSet(ac: AudioContext, set: KeySound): Promise<void> {
  const pending = loading.get(set);
  if (pending) return pending;
  const job = Promise.all(
    Array.from({ length: VARIANTS }, async (_, i) => {
      const res = await fetch(`/sounds/${set}/${i + 1}.wav`);
      if (!res.ok) throw new Error(`sound ${set}/${i + 1}: ${res.status}`);
      return ac.decodeAudioData(await res.arrayBuffer());
    }),
  )
    .then((list) => {
      buffers[set] = list;
    })
    .catch(() => {
      loading.delete(set); // allow a retry on the next press
    });
  loading.set(set, job);
  return job;
}

/** Fetch and decode samples once. Defaults to the four sets every page uses. */
export function preloadKeySounds(sets: readonly KeySound[] = KINDS): Promise<void> {
  const ac = getContext();
  if (!ac) return Promise.resolve();
  return Promise.all(sets.map((set) => loadSet(ac, set))).then(() => undefined);
}

export interface PlayOptions {
  /** 0–1 multiplier on the set's own gain */
  volume?: number;
  /** playback rate; below 1 drops the pitch */
  rate?: number;
}

export function playKeySound(kind: KeySound = 'plain', opts: PlayOptions = {}) {
  if (!isKeySoundOn()) return;
  try {
    const ac = getContext();
    if (!ac) return;
    if (ac.state === 'suspended') void ac.resume();

    const list = buffers[kind];
    if (!list?.length) {
      void loadSet(ac, kind);
      return;
    }

    const src = ac.createBufferSource();
    src.buffer = list[Math.floor(Math.random() * list.length)];
    src.playbackRate.value = (opts.rate ?? 1) * (0.97 + Math.random() * 0.06); // no two presses identical
    const gain = ac.createGain();
    gain.gain.value = (GAIN[kind] ?? DEFAULT_GAIN) * (opts.volume ?? 1);
    src.connect(gain).connect(ac.destination);
    src.start();
  } catch {
    /* audio is a nicety; never block navigation */
  }
}

export type ErrorSound = 'off' | 'thud' | 'buzz';

/**
 * The miss: either the chosen switch bottoming out an octave low (thud),
 * or a short filtered buzz drawn with an oscillator, no sample needed.
 */
export function playErrorSound(style: ErrorSound, kind: KeySound, volume = 1) {
  if (style === 'off' || !isKeySoundOn()) return;
  if (style === 'thud') {
    playKeySound(kind, { volume: Math.min(1, volume * 1.15), rate: 0.55 });
    return;
  }
  try {
    const ac = getContext();
    if (!ac) return;
    if (ac.state === 'suspended') void ac.resume();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.09);
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18 * volume + 0.0001, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    osc.connect(filter).connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  } catch {
    /* audio is a nicety */
  }
}

/** Which sound an element should make, from its keycap classes. */
export function keySoundKindFor(el: Element): KeySound {
  const forced = (el as HTMLElement).dataset?.sound;
  if (forced) return forced as KeySound;
  if (el.classList.contains('key--accent')) return 'accent';
  if (el.classList.contains('key--mod')) return 'mod';
  if (el.classList.contains('keycap')) return 'small';
  return 'plain';
}
