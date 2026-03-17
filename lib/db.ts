import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "pcap.db");

/** Opens the database read-only and returns it. Caller is responsible for closing. */
function openDb(): DatabaseSync {
  return new DatabaseSync(DB_PATH, { readOnly: true });
}

export interface StatsRow {
  totalQuestions: number;
  wrongStack: number;
  flaggedStack: number;
  lastSession: {
    id: number;
    score: number;
    total: number;
    mode: string;
    date: string;
    passed: boolean;
  } | null;
}

export function getStats(): StatsRow {
  const db = openDb();

  try {
    const totalQuestions = (
      db.prepare("SELECT COUNT(*) AS n FROM questions").get() as { n: number }
    ).n;

    const wrongStack = (
      db.prepare("SELECT COUNT(*) AS n FROM wrong_stack").get() as { n: number }
    ).n;

    const flaggedStack = (
      db.prepare("SELECT COUNT(*) AS n FROM flagged_stack").get() as { n: number }
    ).n;

    const sessionRow = db
      .prepare(
        `SELECT id, mode, score, total, passed, started_at
         FROM sessions
         WHERE finished_at IS NOT NULL
         ORDER BY started_at DESC
         LIMIT 1`
      )
      .get() as {
        id: number;
        mode: string;
        score: number;
        total: number;
        passed: number;
        started_at: string;
      } | undefined;

    const lastSession = sessionRow
      ? {
          id: sessionRow.id,
          score: sessionRow.score,
          total: sessionRow.total,
          mode: sessionRow.mode,
          date: sessionRow.started_at.slice(0, 10),
          passed: sessionRow.passed === 1,
        }
      : null;

    return { totalQuestions, wrongStack, flaggedStack, lastSession };
  } finally {
    db.close();
  }
}
