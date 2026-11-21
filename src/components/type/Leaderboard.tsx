'use client';

import type { TypingLanguage, TypingMode } from '@/lib/typing/config';
import type { ScoreRow } from '@/services/scores.service';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface LeaderboardProps {
  mode: TypingMode;
  value: number;
  language: TypingLanguage;
  /** bump to refetch after a save */
  version: number;
  /** id of the score just saved, to mark its row */
  highlightId?: number | null;
}

const LANG_NAME: Record<TypingLanguage, string> = { en: 'english', es: 'español' };

function ago(ts: number) {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

type State = { status: 'loading' } | { status: 'error' } | { status: 'ok'; rows: ScoreRow[] };

export function Leaderboard({ mode, value, language, version, highlightId }: LeaderboardProps) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ status: 'loading' });
    fetch(`/api/scores?mode=${mode}&value=${value}&lang=${language}`, { signal: ctrl.signal })
      .then((r) => r.json() as Promise<{ success: boolean; data?: ScoreRow[] }>)
      .then((j) => setState(j.success && j.data ? { status: 'ok', rows: j.data } : { status: 'error' }))
      .catch((e: unknown) => {
        if ((e as Error).name !== 'AbortError') setState({ status: 'error' });
      });
    return () => ctrl.abort();
  }, [mode, value, language, version, retry]);

  return (
    <section className="lb" aria-labelledby="lb-title">
      <header className="lb__head">
        <h2 id="lb-title">Leaderboard</h2>
        <p>
          {mode} {value} · {LANG_NAME[language]}
        </p>
      </header>

      {state.status === 'loading' && <p className="lb__note">Loading scores…</p>}
      {state.status === 'error' && (
        <p className="lb__note">
          The leaderboard did not load.{' '}
          <button type="button" className="lb__retry" onClick={() => setRetry((n) => n + 1)}>
            Try again
          </button>
        </p>
      )}
      {state.status === 'ok' && state.rows.length === 0 && (
        <p className="lb__note">No scores on this board yet. Finish a test and put your name first.</p>
      )}
      {state.status === 'ok' && state.rows.length > 0 && (
        <table className="lb__table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">name</th>
              <th scope="col">wpm</th>
              <th scope="col">acc</th>
              <th scope="col" className="lb__opt">raw</th>
              <th scope="col" className="lb__opt">when</th>
            </tr>
          </thead>
          <tbody>
            {state.rows.map((row, i) => (
              <tr key={row.id} className={cn(row.id === highlightId && 'is-you')}>
                <td className="lb__rank">{i + 1}</td>
                <td className="lb__name">{row.name}</td>
                <td className="lb__wpm">{row.wpm.toFixed(1)}</td>
                <td>{Math.round(row.accuracy)}%</td>
                <td className="lb__opt">{row.raw.toFixed(1)}</td>
                <td className="lb__opt">{ago(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
