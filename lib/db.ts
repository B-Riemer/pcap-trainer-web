import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "pcap.db");

// ── Shared types ──────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: number;
  q_number: number;
  text: string;
  section: string;
  answers: { letter: string; text: string }[];
  correct: string;   // comma-separated original letters: "A" or "C,D"
  multi: boolean;
}

interface DbQuestionRow {
  id: number;
  q_number: number;
  text: string;
  section: string;
  answers_json: string;
  correct: string;
  multi: number;
}

function openDb(): DatabaseSync {
  return new DatabaseSync(DB_PATH, { readOnly: true });
}

function openDbWrite(): DatabaseSync {
  return new DatabaseSync(DB_PATH);
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

// ── Quiz questions ─────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function mapRow(row: DbQuestionRow): QuizQuestion {
  return {
    id: row.id,
    q_number: row.q_number,
    text: row.text,
    section: row.section,
    answers: shuffle(
      JSON.parse(row.answers_json) as { letter: string; text: string }[]
    ),
    correct: row.correct,
    multi: row.multi === 1,
  };
}

export function getExamQuestions(n = 40): QuizQuestion[] {
  const db = openDb();
  try {
    const rows = db
      .prepare("SELECT * FROM questions ORDER BY RANDOM() LIMIT ?")
      .all(n) as unknown as DbQuestionRow[];
    return rows.map(mapRow);
  } finally {
    db.close();
  }
}

export function getLearnQuestions(): QuizQuestion[] {
  const db = openDb();
  try {
    const rows = db
      .prepare("SELECT * FROM questions ORDER BY q_number ASC")
      .all() as unknown as DbQuestionRow[];
    return rows.map(mapRow);
  } finally {
    db.close();
  }
}

export function getWrongStackQuestions(): QuizQuestion[] {
  const db = openDb();
  try {
    const rows = db
      .prepare(
        `SELECT q.* FROM questions q
         JOIN wrong_stack ws ON ws.question_id = q.id
         ORDER BY ws.times_wrong DESC`
      )
      .all() as unknown as DbQuestionRow[];
    return rows.map(mapRow);
  } finally {
    db.close();
  }
}

export function getQuestionsByIds(ids: number[]): QuizQuestion[] {
  if (ids.length === 0) return [];
  const db = openDb();
  try {
    const placeholders = ids.map(() => "?").join(",");
    const rows = db
      .prepare(`SELECT * FROM questions WHERE id IN (${placeholders})`)
      .all(...ids) as unknown as DbQuestionRow[];
    return rows.map(mapRow);
  } finally {
    db.close();
  }
}

export function getFlaggedQuestions(): QuizQuestion[] {
  const db = openDb();
  try {
    const rows = db
      .prepare(
        `SELECT q.* FROM questions q
         JOIN flagged_stack fs ON fs.question_id = q.id`
      )
      .all() as unknown as DbQuestionRow[];
    return rows.map(mapRow);
  } finally {
    db.close();
  }
}

// ── Write operations ───────────────────────────────────────────────────────────

/** Toggle flag on a question. Returns true if now flagged, false if removed. */
export function toggleFlagged(questionId: number): boolean {
  const db = openDbWrite();
  try {
    const existing = db
      .prepare("SELECT 1 FROM flagged_stack WHERE question_id = ?")
      .get(questionId);
    if (existing) {
      db.prepare("DELETE FROM flagged_stack WHERE question_id = ?").run(questionId);
      return false;
    } else {
      db.prepare("INSERT INTO flagged_stack (question_id) VALUES (?)").run(questionId);
      return true;
    }
  } finally {
    db.close();
  }
}

export interface AnswerRecord {
  questionId: number;
  selected: string;
  isCorrect: boolean;
  section: string;
}

/** Save a completed session and update wrong_stack accordingly. */
export function saveSession(
  mode: string,
  score: number,
  total: number,
  passed: boolean,
  answers: AnswerRecord[]
): void {
  const db = openDbWrite();
  const now = new Date().toISOString();
  try {
    db.exec("BEGIN");

    const { lastInsertRowid: sessionId } = db
      .prepare(
        `INSERT INTO sessions (mode, started_at, finished_at, score, total, passed)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(mode, now, now, score, total, passed ? 1 : 0);

    const insertAnswer = db.prepare(
      `INSERT INTO session_answers (session_id, question_id, selected, is_correct, section)
       VALUES (?, ?, ?, ?, ?)`
    );

    for (const ans of answers) {
      insertAnswer.run(sessionId, ans.questionId, ans.selected, ans.isCorrect ? 1 : 0, ans.section);

      if (!ans.isCorrect) {
        db.prepare(
          `INSERT INTO wrong_stack (question_id, times_wrong, last_seen, correct_streak)
           VALUES (?, 1, ?, 0)
           ON CONFLICT(question_id) DO UPDATE SET
             times_wrong    = times_wrong + 1,
             last_seen      = excluded.last_seen,
             correct_streak = 0`
        ).run(ans.questionId, now);
      } else {
        const row = db
          .prepare("SELECT correct_streak FROM wrong_stack WHERE question_id = ?")
          .get(ans.questionId) as { correct_streak: number } | undefined;
        if (row) {
          if (row.correct_streak + 1 >= 2) {
            db.prepare("DELETE FROM wrong_stack WHERE question_id = ?").run(ans.questionId);
          } else {
            db.prepare(
              "UPDATE wrong_stack SET correct_streak = correct_streak + 1, last_seen = ? WHERE question_id = ?"
            ).run(now, ans.questionId);
          }
        }
      }
    }

    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  } finally {
    db.close();
  }
}
