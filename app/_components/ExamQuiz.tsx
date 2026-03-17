"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { QuizQuestion } from "@/lib/db";

const EXAM_SECONDS = 65 * 60;

function setsEqual(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

// ── Timer display ──────────────────────────────────────────────────────────────

function Timer({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  const color =
    seconds < 300 ? "text-pcap-red" : seconds < 600 ? "text-pcap-orange" : "text-pcap-muted";

  return (
    <span className={`font-mono text-sm font-bold tabular-nums ${color}`}>
      {mins}:{secs}
    </span>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current) / total) * 100;
  return (
    <div className="h-1 w-full rounded-full bg-pcap-border">
      <div
        className="h-full rounded-full bg-pcap-blue transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Answer option ──────────────────────────────────────────────────────────────

function AnswerOption({
  letter, text, selected, onToggle,
}: {
  letter: string;
  text: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-pcap-blue bg-pcap-blue-dim text-pcap-text"
          : "border-pcap-border bg-pcap-surface text-pcap-text hover:border-pcap-muted hover:bg-pcap-border/30"
      }`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
          selected
            ? "bg-pcap-blue text-pcap-bg"
            : "bg-pcap-border text-pcap-muted"
        }`}
      >
        {letter}
      </span>
      <span className="text-sm leading-relaxed">{text}</span>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ExamQuiz({ questions }: { questions: QuizQuestion[] }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(EXAM_SECONDS);
  const finishedRef = useRef(false);

  // answers: questionId → comma-separated selected letters
  const answersRef = useRef<Record<number, string>>({});

  const question = questions[idx];
  const total = questions.length;
  const isLast = idx === total - 1;

  // ── Finish & redirect ────────────────────────────────────────────────────────

  const finishQuiz = useCallback(
    (finalAnswers: Record<number, string>) => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      const correctSet = (q: QuizQuestion) =>
        new Set(q.correct.split(",").map((s) => s.trim()));
      const selectedSet = (id: number) =>
        new Set((finalAnswers[id] ?? "").split(",").filter(Boolean));

      const score = questions.reduce(
        (n, q) => n + (setsEqual(selectedSet(q.id), correctSet(q)) ? 1 : 0),
        0
      );

      const passed = score / total >= 0.7;
      router.push(
        `/results?score=${score}&total=${total}&passed=${passed}&mode=exam`
      );
    },
    [questions, total, router]
  );

  // ── Timer ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (finishedRef.current) return;
    if (secondsLeft <= 0) {
      finishQuiz({ ...answersRef.current });
      return;
    }
    const id = setInterval(
      () => setSecondsLeft((s) => s - 1),
      1000
    );
    return () => clearInterval(id);
  }, [secondsLeft, finishQuiz]);

  // ── Navigation ───────────────────────────────────────────────────────────────

  const handleNext = () => {
    const ansStr = [...selected].sort().join(",");
    answersRef.current = { ...answersRef.current, [question.id]: ansStr };

    if (isLast) {
      finishQuiz(answersRef.current);
    } else {
      setIdx((i) => i + 1);
      setSelected(new Set());
    }
  };

  const toggleAnswer = (letter: string) => {
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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-pcap-bg text-pcap-text">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 border-b border-pcap-border bg-pcap-bg px-5 py-3">
        <div className="mx-auto max-w-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-pcap-muted">
              Frage{" "}
              <span className="font-bold text-pcap-text">{idx + 1}</span>
              {" / "}
              {total}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-pcap-muted">⏱</span>
              <Timer seconds={secondsLeft} />
            </div>
          </div>
          <ProgressBar current={idx + 1} total={total} />
        </div>
      </div>

      {/* ── Question area ── */}
      <div className="flex-1 px-5 py-6">
        <div className="mx-auto max-w-xl space-y-4">

          {/* Section badge + question number */}
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

          {/* Question text */}
          <p className="text-sm leading-relaxed text-pcap-text">
            {question.text}
          </p>

          {/* Answers */}
          <div className="space-y-2.5 pt-1">
            {question.answers.map((ans) => (
              <AnswerOption
                key={ans.letter}
                letter={ans.letter}
                text={ans.text}
                selected={selected.has(ans.letter)}
                onToggle={() => toggleAnswer(ans.letter)}
              />
            ))}
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="sticky bottom-0 border-t border-pcap-border bg-pcap-bg px-5 py-4">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <span className="text-xs text-pcap-muted">
            {selected.size === 0
              ? "Keine Auswahl — Frage überspringen"
              : question.multi
              ? `${selected.size} Antwort${selected.size > 1 ? "en" : ""} ausgewählt`
              : "Antwort ausgewählt"}
          </span>
          <button
            onClick={handleNext}
            className="rounded-lg bg-pcap-blue px-6 py-2.5 text-sm font-bold text-pcap-bg transition-opacity hover:opacity-80"
          >
            {isLast ? "Auswertung →" : "Weiter →"}
          </button>
        </div>
      </div>

    </div>
  );
}
