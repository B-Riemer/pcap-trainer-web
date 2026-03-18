"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { QuizQuestion } from "@/lib/db";

// ── Mode config ────────────────────────────────────────────────────────────────

const MODE_CONFIG: Record<string, { label: string; timerSecs: number; feedback: boolean; color: string }> = {
  exam:          { label: "Prüfungsmodus",  timerSecs: 65 * 60, feedback: false, color: "text-pcap-blue" },
  learn:         { label: "Lernmodus",      timerSecs: 0,       feedback: true,  color: "text-pcap-green" },
  "wrong-stack": { label: "Falsch-Stapel",  timerSecs: 0,       feedback: true,  color: "text-pcap-red" },
  flagged:       { label: "Unsicher-Stapel",timerSecs: 0,       feedback: true,  color: "text-pcap-orange" },
  quicktest:     { label: "Schnelltest",    timerSecs: 0,       feedback: false, color: "text-pcap-orange" },
};

const LEARN_QUEUE_KEY = "pcap-learn-queue";

function setsEqual(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Timer({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  const color = seconds < 300 ? "text-pcap-red" : seconds < 600 ? "text-pcap-orange" : "text-pcap-muted";
  return (
    <span className={`font-mono text-sm font-bold tabular-nums ${color}`}>
      {mins}:{secs}
    </span>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-pcap-border">
      <div
        className="h-full rounded-full bg-pcap-blue transition-all duration-300"
        style={{ width: `${total > 0 ? (current / total) * 100 : 0}%` }}
      />
    </div>
  );
}

type AnswerState = "idle" | "selected" | "correct" | "wrong" | "missed";

function AnswerOption({
  letter, text, state, disabled, onToggle,
}: {
  letter: string; text: string; state: AnswerState; disabled: boolean; onToggle: () => void;
}) {
  const containerStyles: Record<AnswerState, string> = {
    idle:     "border-pcap-border bg-pcap-surface hover:border-pcap-muted hover:bg-pcap-border/30",
    selected: "border-pcap-blue bg-pcap-blue-dim",
    correct:  "border-pcap-green bg-pcap-green-dim",
    wrong:    "border-pcap-red bg-pcap-red-dim",
    missed:   "border-pcap-green bg-pcap-green-dim opacity-60",
  };
  const badgeStyles: Record<AnswerState, string> = {
    idle:     "bg-pcap-border text-pcap-muted",
    selected: "bg-pcap-blue text-pcap-bg",
    correct:  "bg-pcap-green text-pcap-bg",
    wrong:    "bg-pcap-red text-pcap-bg",
    missed:   "bg-pcap-green text-pcap-bg",
  };
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-default ${containerStyles[state]}`}
    >
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${badgeStyles[state]}`}>
        {letter}
      </span>
      <span className="text-sm leading-relaxed text-pcap-text">{text}</span>
    </button>
  );
}

function CenteredScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-pcap-bg px-5">
      <div className="text-center">{children}</div>
    </div>
  );
}

// ── Quiz session ───────────────────────────────────────────────────────────────

function QuizSession({ questions, mode }: { questions: QuizQuestion[]; mode: string }) {
  const router = useRouter();
  const cfg = MODE_CONFIG[mode] ?? MODE_CONFIG.exam;
  const isLearn = mode === "learn";
  const total = questions.length;

  // Learn mode: restore queue from localStorage, others start fresh
  const [queue, setQueue] = useState<number[]>(() => {
    if (isLearn) {
      try {
        const saved = localStorage.getItem(LEARN_QUEUE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (
            Array.isArray(parsed) &&
            parsed.every((i) => typeof i === "number" && i >= 0 && i < total)
          ) {
            return parsed as number[];
          }
        }
      } catch {}
    }
    return questions.map((_, i) => i);
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"answering" | "revealed">("answering");
  const [secondsLeft, setSecondsLeft] = useState(cfg.timerSecs);
  // Track which question IDs user flagged this session
  const [flaggedIds, setFlaggedIds] = useState<Set<number>>(new Set());
  const finishedRef = useRef(false);
  const answersRef = useRef<Record<number, string>>({});

  const currentIdx = queue[0];
  const question = questions[currentIdx];
  const answered = total - queue.length;
  const isLast = queue.length === 1;
  const correctSet = new Set(question.correct.split(",").map((s) => s.trim()));
  const isFlagged = flaggedIds.has(question.id);

  // Persist learn queue to localStorage on every change
  useEffect(() => {
    if (isLearn) {
      localStorage.setItem(LEARN_QUEUE_KEY, JSON.stringify(queue));
    }
  }, [isLearn, queue]);

  // ── Finish & save session ─────────────────────────────────────────────────

  const finishQuiz = useCallback(
    async (finalAnswers: Record<number, string>) => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      if (isLearn) {
        localStorage.removeItem(LEARN_QUEUE_KEY);
      }

      const score = questions.reduce((n, q) => {
        const correct = new Set(q.correct.split(",").map((s) => s.trim()));
        const given = new Set((finalAnswers[q.id] ?? "").split(",").filter(Boolean));
        return n + (setsEqual(given, correct) ? 1 : 0);
      }, 0);

      // Compute per-section stats for results page
      const sectionStats: Record<string, { correct: number; total: number }> = {};
      for (const q of questions) {
        const sec = q.section;
        if (!sectionStats[sec]) sectionStats[sec] = { correct: 0, total: 0 };
        sectionStats[sec].total++;
        const correct = new Set(q.correct.split(",").map((s) => s.trim()));
        const given = new Set((finalAnswers[q.id] ?? "").split(",").filter(Boolean));
        if (setsEqual(given, correct)) sectionStats[sec].correct++;
      }

      // Save session + update wrong_stack
      // Await with 3s timeout so home stats are fresh on return; fails silently on Vercel (read-only FS)
      const answeredQuestions = questions.filter((q) => finalAnswers[q.id] !== undefined);
      try {
        await Promise.race([
          fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode,
              score,
              total: answeredQuestions.length,
              passed: score / total >= 0.7,
              answers: answeredQuestions.map((q) => {
                const correct = new Set(q.correct.split(",").map((s) => s.trim()));
                const given = new Set((finalAnswers[q.id] ?? "").split(",").filter(Boolean));
                return {
                  questionId: q.id,
                  selected: finalAnswers[q.id] ?? "",
                  isCorrect: setsEqual(given, correct),
                  section: q.section,
                };
              }),
            }),
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 3000)
          ),
        ]);
      } catch {}

      router.push(
        `/results?score=${score}&total=${total}&passed=${score / total >= 0.7}&mode=${mode}` +
        `&sections=${encodeURIComponent(JSON.stringify(sectionStats))}`
      );
    },
    [questions, total, mode, isLearn, router]
  );

  // ── Timer ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!cfg.timerSecs) return;
    if (finishedRef.current || secondsLeft <= 0) {
      if (secondsLeft <= 0) finishQuiz({ ...answersRef.current });
      return;
    }
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft, cfg.timerSecs, finishQuiz]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const advanceQueue = (ans: Record<number, string>) => {
    const next = queue.slice(1);
    if (next.length === 0) {
      if (isLearn) {
        // Loop: reset to all questions
        localStorage.removeItem(LEARN_QUEUE_KEY);
        setQueue(questions.map((_, i) => i));
        setSelected(new Set());
        setPhase("answering");
        answersRef.current = {};
      } else {
        finishQuiz(ans);
      }
    } else {
      setQueue(next);
      setSelected(new Set());
      setPhase("answering");
    }
  };

  const handleSkip = () => {
    // Move current to back, no answer stored
    setQueue((q) => [...q.slice(1), q[0]]);
    setSelected(new Set());
    setPhase("answering");
  };

  const handleWeiter = () => {
    const ansStr = [...selected].sort().join(",");
    answersRef.current = { ...answersRef.current, [question.id]: ansStr };
    if (cfg.feedback) {
      setPhase("revealed");
    } else {
      advanceQueue(answersRef.current);
    }
  };

  const handleNaechste = () => {
    advanceQueue(answersRef.current);
  };

  const handleHome = () => {
    // Learn mode: state is already saved to localStorage, just navigate
    if (isLearn) {
      router.push("/");
      return;
    }
    // Other modes: confirm if any progress exists
    if (
      Object.keys(answersRef.current).length > 0 &&
      !window.confirm("Quiz verlassen? Fortschritt geht verloren.")
    ) {
      return;
    }
    router.push("/");
  };

  const handleToggleFlag = () => {
    const qid = question.id;
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });
    // Persist to DB (fire-and-forget)
    fetch("/api/flagged", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: qid }),
    }).catch(() => {});
  };

  const toggleAnswer = (letter: string) => {
    if (phase === "revealed") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (question.multi) {
        if (next.has(letter)) next.delete(letter);
        else next.add(letter);
      } else {
        next.clear();
        if (!prev.has(letter)) next.add(letter);
      }
      return next;
    });
  };

  // ── Answer state ──────────────────────────────────────────────────────────

  const answerState = (letter: string): AnswerState => {
    if (phase !== "revealed") return selected.has(letter) ? "selected" : "idle";
    const isCorrect = correctSet.has(letter);
    const wasSelected = selected.has(letter);
    if (isCorrect && wasSelected) return "correct";
    if (!isCorrect && wasSelected) return "wrong";
    if (isCorrect && !wasSelected) return "missed";
    return "idle";
  };

  const isAnswerCorrect = phase === "revealed" && setsEqual(selected, correctSet);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-pcap-bg text-pcap-text">

      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-pcap-border bg-pcap-bg px-5 py-3">
        <div className="mx-auto max-w-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleHome}
                className="text-xs text-pcap-muted transition-colors hover:text-pcap-text"
                title="Zur Startseite"
              >
                🏠 Home
              </button>
              <span className="text-pcap-border">|</span>
              <span className="text-xs text-pcap-muted">
                <span className="font-bold text-pcap-text">{answered}</span>
                {" / "}
                {total}
                {queue.length > 1 && answered < total && (
                  <span className="ml-1">
                    ({queue.length - 1} ausstehend)
                  </span>
                )}
                <span className={`ml-2 font-medium ${cfg.color}`}>· {cfg.label}</span>
              </span>
            </div>
            {cfg.timerSecs > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-pcap-muted">⏱</span>
                <Timer seconds={secondsLeft} />
              </div>
            )}
          </div>
          <ProgressBar current={answered} total={total} />
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 px-5 py-6">
        <div className="mx-auto max-w-xl space-y-4">

          {/* Badges row + flag button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-pcap-blue-dim px-2 py-0.5 text-xs font-medium text-pcap-blue">
                {question.section}
              </span>
              <span className="text-xs text-pcap-muted">#{question.q_number}</span>
              {question.multi && (
                <span className="rounded-md bg-pcap-orange-dim px-2 py-0.5 text-xs font-medium text-pcap-orange">
                  Mehrfachauswahl
                </span>
              )}
            </div>
            {/* Flag / Unsicher button */}
            <button
              onClick={handleToggleFlag}
              title={isFlagged ? "Markierung entfernen" : "Als unsicher markieren"}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                isFlagged
                  ? "border-pcap-orange bg-pcap-orange-dim text-pcap-orange"
                  : "border-pcap-border text-pcap-muted hover:border-pcap-orange hover:text-pcap-orange"
              }`}
            >
              🚩 {isFlagged ? "Unsicher" : "Markieren"}
            </button>
          </div>

          <p className="text-sm leading-relaxed text-pcap-text">{question.text}</p>

          <div className="space-y-2.5 pt-1">
            {question.answers.map((ans) => (
              <AnswerOption
                key={ans.letter}
                letter={ans.letter}
                text={ans.text}
                state={answerState(ans.letter)}
                disabled={phase === "revealed"}
                onToggle={() => toggleAnswer(ans.letter)}
              />
            ))}
          </div>

          {phase === "revealed" && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                isAnswerCorrect
                  ? "border-pcap-green bg-pcap-green-dim text-pcap-green"
                  : "border-pcap-red bg-pcap-red-dim text-pcap-red"
              }`}
            >
              {isAnswerCorrect
                ? "✓ Richtig!"
                : "✗ Falsch — richtige Antwort(en) sind grün markiert"}
            </div>
          )}

        </div>
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 border-t border-pcap-border bg-pcap-bg px-5 py-4">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          {phase !== "revealed" && selected.size === 0 ? (
            <button
              onClick={handleSkip}
              className="rounded-lg border border-pcap-border px-4 py-2 text-xs font-medium text-pcap-muted transition-colors hover:border-pcap-muted hover:text-pcap-text"
            >
              Keine Auswahl — Frage überspringen
            </button>
          ) : (
            <span className="text-xs text-pcap-muted">
              {phase === "revealed"
                ? isAnswerCorrect ? "✓ Richtig!" : "✗ Falsch"
                : question.multi
                ? `${selected.size} Antwort${selected.size > 1 ? "en" : ""} ausgewählt`
                : "Antwort ausgewählt"}
            </span>
          )}
          {phase === "revealed" ? (
            <button
              onClick={handleNaechste}
              className="rounded-lg bg-pcap-blue px-6 py-2.5 text-sm font-bold text-pcap-bg transition-opacity hover:opacity-80"
            >
              {isLast && !isLearn ? "Auswertung →" : "Nächste →"}
            </button>
          ) : (
            <button
              onClick={handleWeiter}
              disabled={selected.size === 0}
              className="rounded-lg bg-pcap-blue px-6 py-2.5 text-sm font-bold text-pcap-bg transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isLast && !cfg.feedback ? "Auswertung →" : "Weiter →"}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

// ── Loader ─────────────────────────────────────────────────────────────────────

function QuizClientInner({ mode }: { mode: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [error, setError] = useState(false);

  const qtN    = mode === "quicktest" ? parseInt(searchParams.get("questions") ?? "15", 10) : 40;
  const qtMins = mode === "quicktest" ? parseInt(searchParams.get("time")      ?? "20", 10) : 0;

  if (mode === "quicktest") {
    MODE_CONFIG.quicktest.timerSecs = qtMins * 60;
  }

  useEffect(() => {
    const url = mode === "quicktest"
      ? `/api/questions?mode=quicktest&limit=${qtN}`
      : `/api/questions?mode=${encodeURIComponent(mode)}`;
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then((data: unknown) => {
        if (Array.isArray(data)) setQuestions(data as QuizQuestion[]);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [mode, qtN]);

  if (error) {
    return (
      <CenteredScreen>
        <p className="text-2xl">⚠️</p>
        <p className="mt-2 text-pcap-muted">Fragen konnten nicht geladen werden.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-lg bg-pcap-blue px-5 py-2 text-sm font-bold text-pcap-bg"
        >
          🏠 Home
        </button>
      </CenteredScreen>
    );
  }

  if (!questions) {
    return (
      <CenteredScreen>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-pcap-border border-t-pcap-blue" />
        <p className="mt-3 text-sm text-pcap-muted">Fragen werden geladen…</p>
      </CenteredScreen>
    );
  }

  if (questions.length === 0) {
    const cfg = MODE_CONFIG[mode];
    return (
      <CenteredScreen>
        <p className="text-3xl">📭</p>
        <p className="mt-2 font-bold text-pcap-text">{cfg?.label ?? mode} ist leer</p>
        <p className="mt-1 text-sm text-pcap-muted">Noch keine Fragen in diesem Stapel.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-lg bg-pcap-blue px-5 py-2 text-sm font-bold text-pcap-bg"
        >
          🏠 Home
        </button>
      </CenteredScreen>
    );
  }

  return <QuizSession questions={questions} mode={mode} />;
}

export function QuizClient({ mode }: { mode: string }) {
  return (
    <Suspense
      fallback={
        <CenteredScreen>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-pcap-border border-t-pcap-blue" />
          <p className="mt-3 text-sm text-pcap-muted">Fragen werden geladen…</p>
        </CenteredScreen>
      }
    >
      <QuizClientInner mode={mode} />
    </Suspense>
  );
}
