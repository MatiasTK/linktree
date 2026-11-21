import { execute, query, queryFirst } from '@/lib/db';
import {
  NAME_MAX,
  NAME_PATTERN,
  WPM_CEILING,
  isLanguage,
  isMode,
  isModeValue,
  wpmFrom,
  type TypingLanguage,
  type TypingMode,
} from '@/lib/typing/config';
import { hashIp, verifyStartToken } from '@/lib/typing/token';
import type { ServiceResult } from './base.service';

export interface ScoreRow {
  id: number;
  name: string;
  wpm: number;
  raw: number;
  accuracy: number;
  consistency: number;
  created_at: number;
}

export interface Board {
  mode: TypingMode;
  modeValue: number;
  language: TypingLanguage;
}

export interface SubmitResult {
  id: number;
  wpm: number;
  rank: number;
}

const BOARD_SIZE = 10;
const SUBMITS_PER_HOUR = 12;
const TIME_SLACK_MS = 1500;
const WORDS_MAX_MS = 10 * 60 * 1000;

function fail<T>(error: string, status = 400): ServiceResult<T> {
  return { success: false, error, status };
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function parseBoard(params: URLSearchParams): Board | null {
  const mode = params.get('mode');
  const language = params.get('lang');
  const modeValue = Number(params.get('value'));
  if (!isMode(mode) || !isLanguage(language) || !isModeValue(mode, modeValue)) return null;
  return { mode, modeValue, language };
}

/** Best score per name, highest first. */
async function top(board: Board): Promise<ScoreRow[]> {
  return query<ScoreRow>(
    `SELECT id, name, wpm, raw, accuracy, consistency, created_at FROM (
       SELECT *, ROW_NUMBER() OVER (PARTITION BY lower(name) ORDER BY wpm DESC, created_at ASC) AS rn
       FROM typing_scores WHERE mode = ? AND mode_value = ? AND language = ?
     ) WHERE rn = 1 ORDER BY wpm DESC, created_at ASC LIMIT ?`,
    [board.mode, board.modeValue, board.language, BOARD_SIZE],
  );
}

async function submit(body: Record<string, unknown>, ip: string): Promise<ServiceResult<SubmitResult>> {
  const { mode, language } = body;
  const modeValue = num(body.modeValue);
  if (!isMode(mode) || !isLanguage(language) || !isModeValue(mode, modeValue)) {
    return fail('Unknown test type');
  }

  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  if (!name || name.length > NAME_MAX || !NAME_PATTERN.test(name)) {
    return fail(`Use 1–${NAME_MAX} letters, numbers, spaces, dots or dashes for the name`);
  }

  const durationMs = num(body.durationMs);
  const charsCorrect = num(body.charsCorrect);
  const charsIncorrect = num(body.charsIncorrect);
  const rawChars = num(body.rawChars);
  const accuracy = num(body.accuracy);
  const consistency = num(body.consistency);
  if (
    durationMs === null ||
    charsCorrect === null ||
    charsIncorrect === null ||
    rawChars === null ||
    accuracy === null ||
    consistency === null ||
    charsCorrect < 0 ||
    charsIncorrect < 0 ||
    rawChars < charsCorrect ||
    accuracy < 0 ||
    accuracy > 100 ||
    consistency < 0 ||
    consistency > 100
  ) {
    return fail('The result is incomplete');
  }

  if (mode === 'time' && Math.abs(durationMs - modeValue * 1000) > TIME_SLACK_MS) {
    return fail('The test length does not match its mode');
  }
  if (mode === 'words' && (durationMs < 1000 || durationMs > WORDS_MAX_MS)) {
    return fail('The test length does not match its mode');
  }

  const issuedAt = await verifyStartToken(body.token);
  if (issuedAt === null) return fail('This test expired. Run a new one to save a score', 403);
  if (Date.now() - issuedAt < durationMs - 500) return fail('This result arrived before the test could end', 403);
  const nonce = String(body.token).split('.')[1];

  const wpm = Math.round(wpmFrom(charsCorrect, durationMs) * 100) / 100;
  const raw = Math.round(wpmFrom(rawChars, durationMs) * 100) / 100;
  if (wpm > WPM_CEILING || raw > WPM_CEILING * 1.2) return fail('That speed is beyond what the board accepts');

  const ipHash = await hashIp(ip);
  const recent = await queryFirst<{ n: number }>(
    'SELECT COUNT(*) AS n FROM typing_scores WHERE ip_hash = ? AND created_at > ?',
    [ipHash, Date.now() - 60 * 60 * 1000],
  );
  if ((recent?.n ?? 0) >= SUBMITS_PER_HOUR) return fail('Too many scores this hour. Try again later', 429);

  const used = await queryFirst<{ id: number }>('SELECT id FROM typing_scores WHERE token_nonce = ?', [nonce]);
  if (used) return fail('This result was already saved', 409);

  const res = await execute(
    `INSERT INTO typing_scores
       (name, mode, mode_value, language, wpm, raw, accuracy, consistency, chars_correct, chars_incorrect, duration_ms, ip_hash, token_nonce, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      mode,
      modeValue,
      language,
      wpm,
      raw,
      Math.round(accuracy * 100) / 100,
      Math.round(consistency * 100) / 100,
      Math.round(charsCorrect),
      Math.round(charsIncorrect),
      Math.round(durationMs),
      ipHash,
      nonce,
      Date.now(),
    ],
  );

  // rank among each name's best, counting only names that beat this run
  const ahead = await queryFirst<{ n: number }>(
    `SELECT COUNT(*) AS n FROM (
       SELECT lower(name) AS who, MAX(wpm) AS best FROM typing_scores
       WHERE mode = ? AND mode_value = ? AND language = ? AND lower(name) <> lower(?)
       GROUP BY who
     ) WHERE best > ?`,
    [mode, modeValue, language, name, wpm],
  );

  return { success: true, data: { id: res.meta.last_row_id, wpm, rank: (ahead?.n ?? 0) + 1 } };
}

async function remove(id: number): Promise<ServiceResult<null>> {
  const res = await execute('DELETE FROM typing_scores WHERE id = ?', [id]);
  if (res.meta.changes === 0) return fail('Score not found', 404);
  return { success: true, data: null };
}

export const scoresService = {
  async top(board: Board): Promise<ServiceResult<ScoreRow[]>> {
    try {
      return { success: true, data: await top(board) };
    } catch (error) {
      console.error('Error loading scores:', error);
      return fail('Could not load the leaderboard', 500);
    }
  },
  async submit(body: Record<string, unknown>, ip: string): Promise<ServiceResult<SubmitResult>> {
    try {
      return await submit(body, ip);
    } catch (error) {
      console.error('Error saving score:', error);
      return fail('Could not save the score', 500);
    }
  },
  remove,
};
