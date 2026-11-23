'use client';

import { playErrorSound, playKeySound, preloadKeySounds } from '@/lib/key-sound';
import { LANGUAGES, MODE_VALUES, NAME_MAX, wpmFrom, type TypingLanguage, type TypingMode } from '@/lib/typing/config';
import { randomWords } from '@/lib/typing/words';
import { cn } from '@/lib/utils';
import { type FormEvent, useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { Leaderboard } from './Leaderboard';
import { ResultChart, type Sample } from './ResultChart';
import { SoundPanel } from './SoundPanel';
import { useTypeSettings, type TypeSettings } from './useTypeSettings';

type Phase = 'ready' | 'running' | 'done';

interface Result {
  mode: TypingMode;
  value: number;
  language: TypingLanguage;
  wpm: number;
  raw: number;
  accuracy: number;
  consistency: number;
  durationMs: number;
  charsCorrect: number;
  rawChars: number;
  chars: { correct: number; incorrect: number; extra: number; missed: number };
  samples: Sample[];
  previousBest: number | null;
}

interface Engine {
  words: string[];
  typed: string[];
  wi: number;
  input: string;
  keystrokes: number;
  correctKeys: number;
  keysInSecond: number;
  errorsInSecond: number;
  startAt: number;
  samples: Sample[];
  token: string | null;
}

const TIME_WORDS = 80;
const EXTRA_LIMIT = 12;
const PB_KEY = 'type-pb';
const NAME_KEY = 'type-name';
const GRACE_MS = 800;
const LANG_NAME: Record<TypingLanguage, string> = { en: 'english', es: 'español' };

function freshEngine(s: Pick<TypeSettings, 'mode' | 'value' | 'language'> | null): Engine {
  // words are random, so they are only drawn on the client (null = server render)
  const words = s ? randomWords(s.language, s.mode === 'words' ? s.value : TIME_WORDS) : [];
  return {
    words,
    typed: [],
    wi: 0,
    input: '',
    keystrokes: 0,
    correctKeys: 0,
    keysInSecond: 0,
    errorsInSecond: 0,
    startAt: 0,
    samples: [],
    token: null,
  };
}

/** characters that count toward WPM: correct words plus their space, and the correct part of the word in progress */
function correctChars(e: Engine): number {
  let n = 0;
  for (let i = 0; i < e.wi; i++) if (e.typed[i] === e.words[i]) n += e.words[i].length + 1;
  const w = e.words[e.wi] ?? '';
  if (e.input && w.startsWith(e.input)) n += e.input.length;
  return n;
}

function charStats(e: Engine) {
  const out = { correct: 0, incorrect: 0, extra: 0, missed: 0 };
  for (let i = 0; i <= e.wi && i < e.words.length; i++) {
    const w = e.words[i];
    const t = i === e.wi ? e.input : (e.typed[i] ?? '');
    for (let j = 0; j < Math.max(w.length, t.length); j++) {
      if (j < t.length && j < w.length) {
        if (t[j] === w[j]) out.correct++;
        else out.incorrect++;
      } else if (j >= w.length) out.extra++;
      else if (i < e.wi) out.missed++;
    }
  }
  return out;
}

function consistencyOf(samples: Sample[]): number {
  const raws = samples.map((s) => s.raw);
  if (raws.length < 2) return 100;
  const mean = raws.reduce((a, b) => a + b, 0) / raws.length;
  if (mean <= 0) return 0;
  const sd = Math.sqrt(raws.reduce((a, b) => a + (b - mean) ** 2, 0) / raws.length);
  return Math.max(0, Math.min(100, 100 * (1 - sd / mean)));
}

function readBest(key: string): number | null {
  try {
    const map = JSON.parse(localStorage.getItem(PB_KEY) ?? '{}') as Record<string, number>;
    return typeof map[key] === 'number' ? map[key] : null;
  } catch {
    return null;
  }
}

function writeBest(key: string, wpm: number) {
  try {
    const map = JSON.parse(localStorage.getItem(PB_KEY) ?? '{}') as Record<string, number>;
    map[key] = wpm;
    localStorage.setItem(PB_KEY, JSON.stringify(map));
  } catch {
    /* personal bests are a convenience */
  }
}

export function TypingTest() {
  const { settings, update, ready } = useTypeSettings();
  const [phase, setPhase] = useState<Phase>('ready');
  const [focused, setFocused] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [, render] = useReducer((n: number) => n + 1, 0);
  const [boardVersion, setBoardVersion] = useState(0);
  const [savedId, setSavedId] = useState<number | null>(null);

  const eng = useRef<Engine>(freshEngine(null));
  const phaseRef = useRef<Phase>('ready');
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const timerRef = useRef<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const wellRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const fetchToken = useCallback(() => {
    const e = eng.current;
    fetch('/api/scores/token')
      .then((r) => r.json() as Promise<{ data?: { token?: string } }>)
      .then((j) => {
        if (eng.current === e) e.token = j.data?.token ?? null;
      })
      .catch(() => {
        /* without a token the score can't be saved; the test still runs */
      });
  }, []);

  const stopTimer = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const reset = useCallback(
    (focus = true) => {
      stopTimer();
      eng.current = freshEngine(settingsRef.current);
      if (inputRef.current) inputRef.current.value = '';
      setResult(null);
      setSavedId(null);
      setPhaseBoth('ready');
      fetchToken();
      render();
      if (focus) requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    },
    [fetchToken],
  );

  const finish = useCallback((durationMs: number) => {
    stopTimer();
    const e = eng.current;
    const s = settingsRef.current;
    // words mode ends mid-second: keep the partial second when it carried real typing
    const partial = durationMs - e.samples.length * 1000;
    if (partial > 200 && e.keysInSecond > 0) {
      const t = e.samples.length + 1;
      e.samples.push({
        t,
        wpm: wpmFrom(correctChars(e), durationMs),
        raw: wpmFrom(e.keysInSecond, partial),
        errors: e.errorsInSecond,
      });
    }
    const charsCorrect = correctChars(e);
    const wpm = wpmFrom(charsCorrect, durationMs);
    const key = `${s.mode}-${s.value}-${s.language}`;
    const previousBest = readBest(key);
    if (previousBest === null || wpm > previousBest) writeBest(key, Math.round(wpm * 100) / 100);

    setResult({
      mode: s.mode,
      value: s.value,
      language: s.language,
      wpm,
      raw: wpmFrom(e.keystrokes, durationMs),
      accuracy: e.keystrokes ? (e.correctKeys / e.keystrokes) * 100 : 0,
      consistency: consistencyOf(e.samples),
      durationMs,
      charsCorrect,
      rawChars: e.keystrokes,
      chars: charStats(e),
      samples: e.samples.slice(),
      previousBest,
    });
    inputRef.current?.blur();
    setPhaseBoth('done');
  }, []);

  const tick = useCallback(() => {
    const e = eng.current;
    const s = settingsRef.current;
    const t = e.samples.length + 1;
    e.samples.push({
      t,
      wpm: wpmFrom(correctChars(e), t * 1000),
      raw: (e.keysInSecond / 5) * 60,
      errors: e.errorsInSecond,
    });
    e.keysInSecond = 0;
    e.errorsInSecond = 0;
    if (s.mode === 'time' && t >= s.value) finish(s.value * 1000);
    else render();
  }, [finish]);

  const start = () => {
    eng.current.startAt = performance.now();
    setPhaseBoth('running');
    timerRef.current = window.setInterval(tick, 1000);
  };

  const sound = (ok: boolean, space = false) => {
    const s = settingsRef.current;
    if (ok) playKeySound(s.sound, { volume: s.volume, rate: space ? 0.9 : 1 });
    else if (s.errorSound === 'off') playKeySound(s.sound, { volume: s.volume });
    else playErrorSound(s.errorSound, s.sound, s.volume);
  };

  const onInput = (ev: FormEvent<HTMLInputElement>) => {
    const el = ev.currentTarget;
    if (phaseRef.current === 'done') {
      el.value = '';
      return;
    }
    const e = eng.current;
    const s = settingsRef.current;
    let v = el.value;
    const word = e.words[e.wi] ?? '';

    const space = v.indexOf(' ');
    if (space !== -1) {
      const before = v.slice(0, space);
      el.value = '';
      if (!before) {
        e.input = '';
        render();
        return; // a space before any letter does nothing
      }
      if (phaseRef.current === 'ready') start();
      const ok = before === word;
      e.keystrokes++;
      e.keysInSecond++;
      if (ok) e.correctKeys++;
      else e.errorsInSecond++;
      sound(ok, true);
      e.typed[e.wi] = before;
      e.wi++;
      e.input = '';
      if (s.mode === 'words' && e.wi >= e.words.length) {
        finish(performance.now() - e.startAt);
        return;
      }
      if (s.mode === 'time' && e.words.length - e.wi < 40) {
        e.words.push(...randomWords(s.language, 40, e.words[e.words.length - 1]));
      }
      render();
      return;
    }

    if (v.length > word.length + EXTRA_LIMIT) {
      v = v.slice(0, word.length + EXTRA_LIMIT);
      el.value = v;
    }
    if (v.length > e.input.length) {
      if (phaseRef.current === 'ready') start();
      let lastOk = true;
      for (let p = e.input.length; p < v.length; p++) {
        const ok = v[p] === word[p];
        e.keystrokes++;
        e.keysInSecond++;
        if (ok) e.correctKeys++;
        else e.errorsInSecond++;
        lastOk = ok;
      }
      sound(lastOk);
    }
    e.input = v;
    e.typed[e.wi] = v;

    if (s.mode === 'words' && e.wi === e.words.length - 1 && v === word) {
      e.wi++;
      e.input = '';
      finish(performance.now() - e.startAt);
      return;
    }
    render();
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    const e = eng.current;
    const s = settingsRef.current;
    if (ev.key === 'Tab') {
      ev.preventDefault();
      playKeySound(s.sound, { volume: s.volume, rate: 0.9 });
      reset();
      return;
    }
    if (ev.key === 'Escape') {
      ev.currentTarget.blur();
      return;
    }
    if (ev.key === 'Enter' || ev.key.startsWith('Arrow') || ev.key === 'Home' || ev.key === 'End') {
      ev.preventDefault();
      return;
    }
    if (ev.key === 'Backspace') {
      if (phaseRef.current === 'done') return;
      playKeySound(s.sound, { volume: s.volume, rate: 0.95 });
      // step back into the previous word only when it was left wrong
      if (e.input === '' && e.wi > 0 && e.typed[e.wi - 1] !== e.words[e.wi - 1]) {
        ev.preventDefault();
        e.wi--;
        e.input = ev.ctrlKey || ev.altKey || ev.metaKey ? '' : (e.typed[e.wi] ?? '');
        e.typed[e.wi] = e.input;
        ev.currentTarget.value = e.input;
        render();
      }
    }
  };

  // settings that change the test start a new one
  useEffect(() => {
    if (!ready) return;
    reset(phaseRef.current !== 'done');
  }, [ready, settings.mode, settings.value, settings.language, reset]);

  useEffect(() => {
    if (!ready) return;
    void preloadKeySounds([settings.sound]);
  }, [ready, settings.sound]);

  useEffect(() => () => stopTimer(), []);

  useEffect(() => {
    // focus the result itself, not a button: a stray last keystroke must not start a new test
    if (phase === 'done') resultsRef.current?.focus({ preventScroll: true });
  }, [phase]);

  // a printable key anywhere on the page goes to the test
  useEffect(() => {
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

    const onDown = (ev: KeyboardEvent) => {
      if (ev.repeat) return;
      const input = inputRef.current;
      if (
        input &&
        phaseRef.current !== 'done' &&
        document.activeElement !== input &&
        ev.key.length === 1 &&
        ev.key !== ' ' &&
        !ev.metaKey &&
        !ev.ctrlKey &&
        !ev.altKey &&
        !isField(ev.target) &&
        !document.querySelector('.sp__panel')
      ) {
        input.focus({ preventScroll: true });
      }
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, []);

  // caret and line scroll follow the word in progress
  useLayoutEffect(() => {
    const lines = linesRef.current;
    const caret = caretRef.current;
    if (!lines || !caret || phase === 'done') return;
    const e = eng.current;
    const wordEl = lines.querySelector<HTMLElement>(`[data-w="${e.wi}"]`);
    if (!wordEl) return;
    const letters = wordEl.children;
    const idx = e.input.length;
    let left = wordEl.offsetLeft;
    if (idx < letters.length) left = (letters[idx] as HTMLElement).offsetLeft;
    else if (letters.length) {
      const last = letters[letters.length - 1] as HTMLElement;
      left = last.offsetLeft + last.offsetWidth;
    }
    const lineH = wordEl.offsetHeight;
    const shift = Math.max(0, wordEl.offsetTop - lineH);
    lines.style.transform = `translateY(${-shift}px)`;
    caret.style.transform = `translate(${left}px, ${wordEl.offsetTop + lineH * 0.16}px)`;
    caret.style.height = `${lineH * 0.68}px`;
  });

  const e = eng.current;
  const elapsed = e.samples.length;
  const progress =
    settings.mode === 'time' ? String(Math.max(0, settings.value - elapsed)) : `${e.wi}/${settings.value}`;
  const liveWpm = e.samples.length ? Math.round(e.samples[e.samples.length - 1].wpm) : null;
  const locked = phase === 'running';

  return (
    <div className="type">
      <div className="board board--type">
        <div className={cn('tf', locked && 'is-locked')} role="toolbar" aria-label="Test settings">
          <div className="tf__group" role="radiogroup" aria-label="Mode">
            {(['time', 'words'] as const).map((m) => (
              <Opt key={m} on={settings.mode === m} onClick={() => update({ mode: m })} sound={settings.sound}>
                {m}
              </Opt>
            ))}
          </div>
          <div className="tf__group" role="radiogroup" aria-label={settings.mode === 'time' ? 'Seconds' : 'Words'}>
            {MODE_VALUES[settings.mode].map((v) => (
              <Opt key={v} on={settings.value === v} onClick={() => update({ value: v })} sound={settings.sound}>
                {v}
              </Opt>
            ))}
          </div>
          <div className="tf__group" role="radiogroup" aria-label="Language">
            {LANGUAGES.map((l) => (
              <Opt key={l} on={settings.language === l} onClick={() => update({ language: l })} sound={settings.sound}>
                {l}
              </Opt>
            ))}
          </div>
          <div className="tf__end">
            <SoundPanel settings={settings} onChange={update} disabled={locked} />
          </div>
        </div>

        {phase !== 'done' || !result ? (
          <>
            <div className="tw__meta" aria-live="off">
              <span className={cn('tw__progress', phase === 'running' && 'is-live')}>{progress}</span>
              <span className="tw__wpm">{liveWpm !== null ? `${liveWpm} wpm` : `${settings.mode} ${settings.value} · ${LANG_NAME[settings.language]}`}</span>
            </div>
            <div
              ref={wellRef}
              className={cn('tw', focused && 'is-focused', !focused && 'is-idle')}
            >
              <input
                ref={inputRef}
                className="tw__input"
                type="text"
                aria-label="Type the words shown"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                onInput={onInput}
                onKeyDown={onKeyDown}
                onSelect={(ev) => {
                  // typing always happens at the end of the word
                  const el = ev.currentTarget;
                  const end = el.value.length;
                  if (el.selectionStart !== end || el.selectionEnd !== end) el.setSelectionRange(end, end);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              <div className="tw__view">
                <div ref={linesRef} className="tw__lines" aria-hidden>
                  <span ref={caretRef} className={cn('tw__caret', phase === 'ready' && 'is-blinking')} />
                  {e.words.map((w, i) => {
                    const t = i < e.wi ? (e.typed[i] ?? '') : i === e.wi ? e.input : '';
                    const len = Math.max(w.length, t.length);
                    return (
                      <span key={i} data-w={i} className={cn('tw__word', i < e.wi && t !== w && 'is-wrong')}>
                        {Array.from({ length: len }, (_, j) => {
                          const cls =
                            j >= w.length ? 'x' : j >= t.length ? '' : t[j] === w[j] ? 'ok' : 'no';
                          return (
                            <span key={j} className={cls || undefined}>
                              {j < w.length ? w[j] : t[j]}
                            </span>
                          );
                        })}
                      </span>
                    );
                  })}
                </div>
              </div>
              <p className="sr-only">{e.words.slice(e.wi, e.wi + 12).join(' ')}</p>
              {!focused && (
                <p className="tw__cover">
                  <span className="hidden sm:inline">Click here or press any letter to start typing</span>
                  <span className="sm:hidden">Tap to start typing</span>
                </p>
              )}
            </div>
          </>
        ) : (
          <Results result={result} onNext={() => reset()} resultsRef={resultsRef} token={e.token} onSaved={(id) => {
            setSavedId(id);
            setBoardVersion((v) => v + 1);
          }} />
        )}
      </div>

      <Leaderboard
        mode={settings.mode}
        value={settings.value}
        language={settings.language}
        version={boardVersion}
        highlightId={savedId}
      />
    </div>
  );
}

function Opt({
  on,
  onClick,
  sound,
  children,
}: {
  on: boolean;
  onClick: () => void;
  sound: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" role="radio" aria-checked={on} className="keycap tf__opt" onClick={onClick} data-sound={sound}>
      <span className="led" data-on={on || undefined} aria-hidden />
      {children}
    </button>
  );
}

function fmt(n: number, d = 0) {
  return n.toFixed(d);
}

function Results({
  result,
  onNext,
  resultsRef,
  token,
  onSaved,
}: {
  result: Result;
  onNext: () => void;
  resultsRef: React.RefObject<HTMLDivElement | null>;
  token: string | null;
  onSaved: (id: number) => void;
}) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' | 'saved' | 'error'; text?: string }>({
    kind: 'idle',
  });

  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) ?? '');
    } catch {
      /* no remembered name */
    }
  }, []);

  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = performance.now();
  }, []);

  /** keys still in flight from the last word must not skip the result */
  const next = () => {
    if (performance.now() - shownAt.current < GRACE_MS) return;
    onNext();
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== 'Enter' || ev.repeat) return;
      const t = ev.target as HTMLElement | null;
      if (t && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(t.tagName)) return;
      ev.preventDefault();
      next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const { chars } = result;
  const best = result.previousBest;
  const isBest = best === null || result.wpm > best;
  const canSave = result.charsCorrect > 0 && result.wpm > 0;

  const save = async (ev: FormEvent) => {
    ev.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setStatus({ kind: 'error', text: 'Write a name for the leaderboard first.' });
      return;
    }
    if (!token) {
      setStatus({ kind: 'error', text: 'This test could not reach the server. Run a new one to save a score.' });
      return;
    }
    setStatus({ kind: 'saving' });
    try {
      localStorage.setItem(NAME_KEY, clean);
    } catch {
      /* remembering the name is a convenience */
    }
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: clean,
          mode: result.mode,
          modeValue: result.value,
          language: result.language,
          durationMs: Math.round(result.durationMs),
          charsCorrect: result.charsCorrect,
          charsIncorrect: chars.incorrect + chars.extra,
          rawChars: result.rawChars,
          accuracy: result.accuracy,
          consistency: result.consistency,
        }),
      });
      const j = (await res.json()) as { success: boolean; data?: { id: number; rank: number }; error?: string };
      if (!j.success || !j.data) {
        setStatus({ kind: 'error', text: j.error ?? 'The score was not saved. Try again.' });
        return;
      }
      setStatus({ kind: 'saved', text: `Saved. You are #${j.data.rank} on this board.` });
      onSaved(j.data.id);
    } catch {
      setStatus({ kind: 'error', text: 'No connection. The score was not saved; try again.' });
    }
  };

  return (
    <div ref={resultsRef} className="tr" tabIndex={-1} aria-label="Results">
      <div className="tr__top">
        <div className="tr__caps">
          <div className="key key--accent key--stat" style={{ '--i': 0 } as React.CSSProperties}>
            <span className="key__cap">
              <span className="key__num">wpm</span>
              <span className="stat__value">{fmt(result.wpm)}</span>
              <span className="stat__meta">
                {isBest ? (best === null ? 'first run on this test' : 'new personal best') : `best ${fmt(best ?? 0)}`}
              </span>
            </span>
          </div>
          <div className="key key--stat" style={{ '--i': 1 } as React.CSSProperties}>
            <span className="key__cap">
              <span className="key__num">acc</span>
              <span className="stat__value">
                {fmt(result.accuracy)}
                <small>%</small>
              </span>
              <span className="stat__meta">{chars.incorrect + chars.extra} wrong {chars.incorrect + chars.extra === 1 ? 'key' : 'keys'}</span>
            </span>
          </div>
        </div>
        <div className="tr__chart">
          <ResultChart samples={result.samples} />
        </div>
      </div>

      <dl className="tr__stats">
        <div>
          <dt>raw</dt>
          <dd>{fmt(result.raw)}</dd>
        </div>
        <div>
          <dt>consistency</dt>
          <dd>{fmt(result.consistency)}%</dd>
        </div>
        <div>
          <dt title="correct / incorrect / extra / missed">characters</dt>
          <dd>
            {chars.correct}/{chars.incorrect}/{chars.extra}/{chars.missed}
          </dd>
        </div>
        <div>
          <dt>time</dt>
          <dd>{fmt(result.durationMs / 1000, 1)}s</dd>
        </div>
        <div>
          <dt>test</dt>
          <dd>
            {result.mode} {result.value} · {result.language}
          </dd>
        </div>
      </dl>

      <div className="tr__actions">
        <form className="tr__save" onSubmit={save}>
          <label htmlFor="type-name" className="sr-only">
            Name for the leaderboard
          </label>
          <input
            id="type-name"
            className="input"
            placeholder="your name"
            maxLength={NAME_MAX}
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            disabled={!canSave || status.kind === 'saving' || status.kind === 'saved'}
            autoComplete="nickname"
          />
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={!canSave || status.kind === 'saving' || status.kind === 'saved'}
          >
            {status.kind === 'saving' ? 'Saving…' : status.kind === 'saved' ? 'Saved' : 'Save score'}
          </button>
          <p className={cn('tr__status', status.kind === 'error' && 'is-error')} role="status">
            {!canSave ? 'Nothing typed correctly, so there is no score to save.' : status.text}
          </p>
        </form>
        <button type="button" className="key key--mod key--next" onClick={next} data-sound="mod">
          <span className="key__cap">
            <span className="key__num">enter</span>
            <span className="key__label">Next test</span>
          </span>
        </button>
      </div>
    </div>
  );
}
