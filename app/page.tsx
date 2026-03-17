import Link from "next/link";
import { getStats } from "@/lib/db";
import { QuickTestCard } from "./_components/QuickTestCard";

// ── Static data ───────────────────────────────────────────────────────────────

const SECTIONS = [
  { name: "OOP",           pct: 34, color: "bg-pcap-blue" },
  { name: "Diverses",      pct: 22, color: "bg-pcap-orange" },
  { name: "Strings",       pct: 18, color: "bg-pcap-green" },
  { name: "Exceptions",    pct: 14, color: "bg-pcap-red" },
  { name: "Module/Pakete", pct: 12, color: "bg-pcap-muted" },
];

// ── Shared UI primitives ──────────────────────────────────────────────────────

function Card({ children, coloredBorder }: {
  children: React.ReactNode;
  coloredBorder?: string;
}) {
  return (
    <div className={`rounded-xl border bg-pcap-surface p-5 ${coloredBorder ?? "border-pcap-border"}`}>
      {children}
    </div>
  );
}

function ModeCard({ icon, title, lines, titleColor, btnBg, href }: {
  icon: string;
  title: string;
  lines: string[];
  titleColor: string;
  btnBg: string;
  href?: string;
}) {
  return (
    <Card>
      <div className="flex flex-col items-center text-center">
        <span className="mb-2 text-4xl">{icon}</span>
        <h2 className={`text-base font-bold ${titleColor}`}>{title}</h2>
        {lines.map((l) => (
          <p key={l} className="mt-0.5 text-xs text-pcap-muted">{l}</p>
        ))}
        {href ? (
          <Link href={href} className={`mt-4 block w-full rounded-lg py-2 text-center text-sm font-bold text-pcap-bg transition-opacity hover:opacity-80 ${btnBg}`}>
            Starten →
          </Link>
        ) : (
          <button className={`mt-4 w-full rounded-lg py-2 text-sm font-bold text-pcap-bg transition-opacity hover:opacity-80 ${btnBg}`}>
            Starten →
          </button>
        )}
      </div>
    </Card>
  );
}

function SectionBar({ name, pct, color }: { name: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-xs text-pcap-text">{name}</span>
      <div className="h-1.5 flex-1 rounded-full bg-pcap-bg">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs text-pcap-muted">{pct} %</span>
    </div>
  );
}

// ── Page (Server Component) ───────────────────────────────────────────────────

export default async function Home() {
  const { totalQuestions, wrongStack, flaggedStack, lastSession } = getStats();

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
            href="/quiz/exam"
          />
          <ModeCard
            icon="📖"
            title="Lernmodus"
            lines={[`Alle ${totalQuestions} Fragen`, "Kein Timer · Sofort-Feedback"]}
            titleColor="text-pcap-green"
            btnBg="bg-pcap-green"
            href="/quiz/learn"
          />
        </div>

        {/* ── Schnelltest (Client Component für Toggles) ── */}
        <div className="mb-3">
          <QuickTestCard />
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
          </Card>
        </div>

        {/* ── Statistik ── */}
        <Card>
          <p className="mb-3 text-xs font-bold tracking-widest text-pcap-blue">STATISTIK</p>

          <div className="space-y-2">
            {([
              ["Fragen gesamt",      String(totalQuestions)],
              ["Im Falsch-Stapel",   String(wrongStack)],
              ["Im Unsicher-Stapel", String(flaggedStack)],
              ["Bestehensgrenze",    "70 %"],
              ["Prüfung",            "40 Fragen · 65 Minuten"],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-sm text-pcap-muted">{label}</span>
                <span className="text-sm font-bold text-pcap-text">{value}</span>
              </div>
            ))}
          </div>

          {lastSession && (
            <>
              <div className="my-4 border-t border-pcap-border" />
              <p className="mb-3 text-xs font-bold tracking-widest text-pcap-blue">LETZTE SESSION</p>
              <div className="space-y-2">
                {([
                  ["Datum",   lastSession.date],
                  ["Modus",   lastSession.mode],
                  ["Ergebnis", `${lastSession.score} / ${lastSession.total}`],
                  ["Bestanden", lastSession.passed ? "✅ Ja" : "❌ Nein"],
                ] as [string, string][]).map(([label, value]) => (
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
            {SECTIONS.map((s) => (
              <SectionBar key={s.name} {...s} />
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
