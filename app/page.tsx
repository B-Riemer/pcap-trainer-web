import Link from "next/link";
import { getStats } from "@/lib/db";
import { QuickTestCard } from "./_components/QuickTestCard";
import { HomeClient } from "./_components/HomeClient";

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

// ── Page (Server Component) ───────────────────────────────────────────────────

export default async function Home() {
  const { totalQuestions } = getStats();

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

        <HomeClient totalQuestions={totalQuestions} />

      </div>
    </div>
  );
}
