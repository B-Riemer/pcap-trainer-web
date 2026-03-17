"use client";

import { useState } from "react";

// ── Dummy data (replace with real API later) ──────────────────────────────────

const DUMMY_STATS = {
  totalQuestions: 191,
  wrongStack: 12,
  flaggedStack: 5,
};

const SECTIONS = [
  { name: "OOP",           pct: 34, color: "bg-pcap-blue" },
  { name: "Diverses",      pct: 22, color: "bg-pcap-orange" },
  { name: "Strings",       pct: 18, color: "bg-pcap-green" },
  { name: "Exceptions",    pct: 14, color: "bg-pcap-red" },
  { name: "Module/Pakete", pct: 12, color: "bg-pcap-muted" },
];

const QT_COUNTS = [10, 15, 20];
const QT_TIMES  = [15, 20, 30];

// ── Sub-components ────────────────────────────────────────────────────────────

function Card({ children, coloredBorder }: {
  children: React.ReactNode;
  coloredBorder?: string;
}) {
  return (
    <div
      className={`rounded-xl border bg-pcap-surface p-5 ${
        coloredBorder ?? "border-pcap-border"
      }`}
    >
      {children}
    </div>
  );
}

function ModeCard({
  icon, title, lines, titleColor, btnBg,
}: {
  icon: string;
  title: string;
  lines: string[];
  titleColor: string;
  btnBg: string;
}) {
  return (
    <Card>
      <div className="flex flex-col items-center text-center">
        <span className="mb-2 text-4xl">{icon}</span>
        <h2 className={`text-base font-bold ${titleColor}`}>{title}</h2>
        {lines.map((l) => (
          <p key={l} className="mt-0.5 text-xs text-pcap-muted">{l}</p>
        ))}
        <button
          className={`mt-4 w-full rounded-lg py-2 text-sm font-bold text-pcap-bg transition-opacity hover:opacity-80 ${btnBg}`}
        >
          Starten →
        </button>
      </div>
    </Card>
  );
}

function ToggleGroup<T extends number>({
  label, values, selected, onSelect, formatLabel,
}: {
  label: string;
  values: T[];
  selected: T;
  onSelect: (v: T) => void;
  formatLabel?: (v: T) => string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-10 shrink-0 text-xs text-pcap-muted">{label}</span>
      {values.map((v) => (
        <button
          key={v}
          onClick={() => onSelect(v)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            v === selected
              ? "bg-pcap-orange text-pcap-bg"
              : "bg-pcap-border text-pcap-text hover:bg-pcap-muted/30"
          }`}
        >
          {formatLabel ? formatLabel(v) : v}
        </button>
      ))}
    </div>
  );
}

function SectionBar({ name, pct, color }: { name: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-xs text-pcap-text">{name}</span>
      <div className="h-1.5 flex-1 rounded-full bg-pcap-bg">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-pcap-muted">{pct} %</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [qtN, setQtN]       = useState(15);
  const [qtMins, setQtMins] = useState(20);

  const { totalQuestions, wrongStack, flaggedStack } = DUMMY_STATS;

  return (
    <div className="min-h-screen bg-pcap-bg font-sans text-pcap-text">
      <div className="mx-auto max-w-xl px-5 py-10">

        {/* ── Header ── */}
        <div className="mb-8 text-center">
          <div className="mb-1 text-5xl">🐍</div>
          <h1 className="text-xl font-bold text-pcap-blue">PCAP-31-03 Trainer</h1>
          <p className="mt-1 text-xs text-pcap-muted">
            Python Institute · Zertifizierungsvorbereitung
          </p>
        </div>

        {/* ── Prüfungs- & Lernmodus ── */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <ModeCard
            icon="🎯"
            title="Prüfungsmodus"
            lines={["40 Fragen · 65 Minuten", "70 % zum Bestehen"]}
            titleColor="text-pcap-blue"
            btnBg="bg-pcap-blue"
          />
          <ModeCard
            icon="📖"
            title="Lernmodus"
            lines={["Alle 191 Fragen", "Kein Timer · Sofort-Feedback"]}
            titleColor="text-pcap-green"
            btnBg="bg-pcap-green"
          />
        </div>

        {/* ── Schnelltest ── */}
        <div className="mb-3">
          <Card>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="text-base font-bold text-pcap-orange">⚡ Schnelltest</h2>
              <span className="text-xs text-pcap-muted">
                Zufällige Fragen · mit Timer · wie Prüfungsmodus
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ToggleGroup
                label="Fragen:"
                values={QT_COUNTS}
                selected={qtN}
                onSelect={setQtN}
              />
              <ToggleGroup
                label="Zeit:"
                values={QT_TIMES}
                selected={qtMins}
                onSelect={setQtMins}
                formatLabel={(v) => `${v} min`}
              />
              <button className="ml-auto rounded-md bg-pcap-orange px-4 py-1.5 text-xs font-bold text-pcap-bg transition-opacity hover:opacity-80">
                Start →
              </button>
            </div>
          </Card>
        </div>

        {/* ── Falsch-Stapel ── */}
        <div className="mb-3">
          <Card coloredBorder={wrongStack > 0 ? "border-pcap-red" : "border-pcap-border"}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-base font-bold ${wrongStack > 0 ? "text-pcap-red" : "text-pcap-muted"}`}>
                  ❌ Falsch-Stapel
                </h2>
                <p className="mt-0.5 text-xs text-pcap-muted">
                  {wrongStack > 0
                    ? `${wrongStack} Fragen zum Wiederholen · erst nach 2× richtig entfernt`
                    : "Noch keine falschen Antworten"}
                </p>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                <button
                  disabled={wrongStack === 0}
                  className="rounded-lg bg-pcap-red px-4 py-2 text-sm font-bold text-pcap-bg transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Üben →
                </button>
                <button
                  disabled={wrongStack === 0}
                  title="Stapel zurücksetzen"
                  className="rounded-lg border border-pcap-border px-3 py-2 text-sm text-pcap-muted transition-colors hover:bg-pcap-border disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ↺
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Unsicher-Stapel ── */}
        <div className="mb-6">
          <Card coloredBorder={flaggedStack > 0 ? "border-pcap-orange" : "border-pcap-border"}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-base font-bold ${flaggedStack > 0 ? "text-pcap-orange" : "text-pcap-muted"}`}>
                  🚩 Unsicher-Stapel
                </h2>
                <p className="mt-0.5 text-xs text-pcap-muted">
                  {flaggedStack > 0
                    ? `${flaggedStack} markierte Fragen`
                    : "Noch keine markierten Fragen"}
                </p>
              </div>
              <button
                disabled={flaggedStack === 0}
                className="ml-4 shrink-0 rounded-lg bg-pcap-orange px-4 py-2 text-sm font-bold text-pcap-bg transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Üben →
              </button>
            </div>
          </Card>
        </div>

        {/* ── Statistik ── */}
        <Card>
          <p className="mb-3 text-xs font-bold tracking-widest text-pcap-blue">
            STATISTIK
          </p>

          <div className="space-y-2">
            {[
              ["Fragen gesamt",      String(totalQuestions)],
              ["Im Falsch-Stapel",   String(wrongStack)],
              ["Im Unsicher-Stapel", String(flaggedStack)],
              ["Bestehensgrenze",    "70 %"],
              ["Prüfung",            "40 Fragen · 65 Minuten"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-sm text-pcap-muted">{label}</span>
                <span className="text-sm font-bold text-pcap-text">{value}</span>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-pcap-border" />

          <p className="mb-3 text-xs font-bold tracking-widest text-pcap-blue">
            PRÜFUNGSANTEILE
          </p>
          <div className="space-y-2.5">
            {SECTIONS.map((s) => (
              <SectionBar key={s.name} {...s} />
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
