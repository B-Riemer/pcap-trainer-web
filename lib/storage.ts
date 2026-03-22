// localStorage-based write strategy — works everywhere (incl. Vercel read-only FS)

const SESSIONS_KEY = "pcap-sessions";
const WRONG_KEY    = "pcap-wrong-stack";
const FLAGGED_KEY  = "pcap-flagged";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StoredSession {
  id: string;
  mode: string;
  score: number;
  total: number;
  passed: boolean;
  date: string; // ISO string
}

export interface WrongEntry {
  questionId: number;
  timesWrong: number;
  correctStreak: number;
}

// ── Internal helpers ───────────────────────────────────────────────────────────

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function readWrongMap(): Record<string, WrongEntry> {
  return read<Record<string, WrongEntry>>(WRONG_KEY, {});
}

// ── Sessions ───────────────────────────────────────────────────────────────────

export function saveSession(data: Omit<StoredSession, "id">): void {
  const sessions = read<StoredSession[]>(SESSIONS_KEY, []);
  const session: StoredSession = {
    ...data,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
  // Keep last 100 sessions
  write(SESSIONS_KEY, [...sessions, session].slice(-100));
}

export function getLastSession(): StoredSession | null {
  const sessions = read<StoredSession[]>(SESSIONS_KEY, []);
  return sessions.length > 0 ? sessions[sessions.length - 1] : null;
}

// ── Wrong stack ────────────────────────────────────────────────────────────────

/**
 * Update wrong stack after an answer.
 * - Wrong: increment timesWrong, reset correctStreak
 * - Correct: increment correctStreak; remove from stack after 2 consecutive correct
 */
export function updateWrongStack(questionId: number, isCorrect: boolean): void {
  const map = readWrongMap();
  const key = String(questionId);

  if (!isCorrect) {
    const entry = map[key];
    map[key] = entry
      ? { ...entry, timesWrong: entry.timesWrong + 1, correctStreak: 0 }
      : { questionId, timesWrong: 1, correctStreak: 0 };
  } else {
    const entry = map[key];
    if (entry) {
      if (entry.correctStreak + 1 >= 2) {
        delete map[key];
      } else {
        map[key] = { ...entry, correctStreak: entry.correctStreak + 1 };
      }
    }
  }

  write(WRONG_KEY, map);
}

export function getWrongStack(): WrongEntry[] {
  return Object.values(readWrongMap()).sort((a, b) => b.timesWrong - a.timesWrong);
}

/** Returns question IDs sorted by timesWrong DESC — use to fetch questions. */
export function getWrongStackIds(): number[] {
  return getWrongStack().map((e) => e.questionId);
}

export function getWrongStackCount(): number {
  return Object.keys(readWrongMap()).length;
}

export function clearWrongStack(): void {
  write(WRONG_KEY, {});
}

// ── Flagged stack ──────────────────────────────────────────────────────────────

export function getFlaggedStack(): number[] {
  return read<number[]>(FLAGGED_KEY, []);
}

export function getFlaggedCount(): number {
  return getFlaggedStack().length;
}

export function updateFlaggedStack(questionId: number, flagged: boolean): void {
  const stack = getFlaggedStack();
  if (flagged) {
    if (!stack.includes(questionId)) write(FLAGGED_KEY, [...stack, questionId]);
  } else {
    write(FLAGGED_KEY, stack.filter((id) => id !== questionId));
  }
}

/** Toggle flag, return new state (true = now flagged). */
export function toggleFlagged(questionId: number): boolean {
  const nowFlagged = !getFlaggedStack().includes(questionId);
  updateFlaggedStack(questionId, nowFlagged);
  return nowFlagged;
}
