"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getWrongStackCount,
  getFlaggedCount,
  getLastSession,
  clearWrongStack,
  type StoredSession,
} from "@/lib/storage";

const SECTIONS = [
  { name: "OOP",           pct: 34, color: "bg-pcap-blue" },
  { name: "Diverses",      pct: 22, color: "bg-pcap-orange" },
  { name: "Strings",       pct: 18, color: "bg-pcap-green" },
  { name: "Exceptions",    pct: 14, color: "bg-pcap-red" },
  { name: "Module/Pakete", pct: 12, color: "bg-pcap-muted" },
];

const MODE_LABELS: Record<string, string> = {
  exam:          "Prüfungsmodus",
  learn:         "Lernmodus",
  "wrong-stack": "Falsch-Stapel",
  flagged:       "Unsicher-Stapel",
  quicktest:     "Schnelltest",
};

export function HomeClient({ totalQuestions }: { totalQuestions: number }) {
  const [wrongStack,   setWrongStack]   = useState(0);
  const [flaggedStack, setFlaggedStack] = useState(0);
  const [lastSession,  setLastSession]  = useState<StoredSession | null>(null);

  useEffect(() => {
    setWrongStack(getWrongStackCount());
    setFlaggedStack(getFlaggedCount());
    setLastSession(getLastSession());
  }, []);

  const handleClearWrongStack = () => {
    clearWrongStack();
    setWrongStack(0);
  };

  return (
    <>
      {/* ── Falsch-Stapel ── */}
      <div className="mb-3">
        <div
          className={`rounded-xl border bg-pcap-surface p-5 ${
            wrongStack > 0 ? "border-pcap-red" : "border-pcap-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className={`text-base font-bold ${
                  wrongStack > 0 ? "text-pcap-red" : "text-pcap-muted"
                }`}
              >
                ❌ Falsch-Stapel
              </h2>
              <p className="mt-0.5 text-xs text-pcap-muted">
                {wrongStack > 0
                  ? `${wrongStack} Fragen zum Wiederholen · erst nach 2× richtig entfernt`
                  : "Noch keine falschen Antworten"}
              </p>
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-2">
              {wrongStack > 0 ? (
                <Link
                  href="/quiz/wrong-stack"
                  className="rounded-lg bg-pcap-red px-4 py-2 text-sm font-bold text-pcap-bg transition-opacity hover:opacity-80"
                >
                  Üben →
                </Link>
              ) : (
                <button
                  disabled
                  className="rounded-lg bg-pcap-red px-4 py-2 text-sm font-bold text-pcap-bg disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Üben →
                </button>
              )}
              <button
                onClick={handleClearWrongStack}
                disabled={wrongStack === 0}
                title="Stapel zurücksetzen"
                className="rounded-lg border border-pcap-border px-3 py-2 text-sm text-pcap-muted transition-colors hover:bg-pcap-border disabled:cursor-not-allowed disabled:opacity-30"
              >
                ↺
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Unsicher-Stapel ── */}
      <div className="mb-6">
        <div
          className={`rounded-xl border bg-pcap-surface p-5 ${
            flaggedStack > 0 ? "border-pcap-orange" : "border-pcap-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className={`text-base font-bold ${
                  flaggedStack > 0 ? "text-pcap-orange" : "text-pcap-muted"
                }`}
              >
                🚩 Unsicher-Stapel
              </h2>
              <p className="mt-0.5 text-xs text-pcap-muted">
                {flaggedStack > 0
                  ? `${flaggedStack} markierte Fragen`
                  : "Noch keine markierten Fragen"}
              </p>
            </div>
            {flaggedStack > 0 ? (
              <Link
                href="/quiz/flagged"
                className="ml-4 shrink-0 rounded-lg bg-pcap-orange px-4 py-2 text-sm font-bold text-pcap-bg transition-opacity hover:opacity-80"
              >
                Üben →
              </Link>
            ) : (
              <button
                disabled
                className="ml-4 shrink-0 rounded-lg bg-pcap-orange px-4 py-2 text-sm font-bold text-pcap-bg disabled:cursor-not-allowed disabled:opacity-30"
              >
                Üben →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Statistik ── */}
      <div className="rounded-xl border border-pcap-border bg-pcap-surface p-5">
        <p className="mb-3 text-xs font-bold tracking-widest text-pcap-blue">STATISTIK</p>

        <div className="space-y-2">
          {(
            [
              ["Fragen gesamt",      String(totalQuestions)],
              ["Im Falsch-Stapel",   String(wrongStack)],
              ["Im Unsicher-Stapel", String(flaggedStack)],
              ["Bestehensgrenze",    "70 %"],
              ["Prüfung",            "40 Fragen · 65 Minuten"],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-sm text-pcap-muted">{label}</span>
              <span className="text-sm font-bold text-pcap-text">{value}</span>
            </div>
          ))}
        </div>

        {lastSession && (
          <>
            <div className="my-4 border-t border-pcap-border" />
            <p className="mb-3 text-xs font-bold tracking-widest text-pcap-blue">
              LETZTE SESSION
            </p>
            <div className="space-y-2">
              {(
                [
                  ["Datum",    lastSession.date.slice(0, 10)],
                  ["Modus",    MODE_LABELS[lastSession.mode] ?? lastSession.mode],
                  ["Ergebnis", `${lastSession.score} / ${lastSession.total}`],
                  ["Bestanden", lastSession.passed ? "✅ Ja" : "❌ Nein"],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-sm text-pcap-muted">{label}</span>
                  <span className="text-sm font-bold text-pcap-text">{value}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="my-4 border-t border-pcap-border" />
        <p className="mb-3 text-xs font-bold tracking-widest text-pcap-blue">PRÜFUNGSANTEILE</p>
        <div className="space-y-2.5">
          {SECTIONS.map(({ name, pct, color }) => (
            <div key={name} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-xs text-pcap-text">{name}</span>
              <div className="h-1.5 flex-1 rounded-full bg-pcap-bg">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 text-right text-xs text-pcap-muted">{pct} %</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
