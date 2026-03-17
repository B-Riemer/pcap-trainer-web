import Link from "next/link";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ score?: string; total?: string; passed?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const score  = parseInt(params.score  ?? "0", 10);
  const total  = parseInt(params.total  ?? "40", 10);
  const passed = params.passed === "true";
  const pct    = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-pcap-bg px-5 text-pcap-text">
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Result icon */}
        <div className="text-6xl">{passed ? "🎉" : "📚"}</div>

        {/* Score */}
        <div>
          <p className={`text-4xl font-bold ${passed ? "text-pcap-green" : "text-pcap-red"}`}>
            {pct} %
          </p>
          <p className="mt-1 text-sm text-pcap-muted">
            {score} von {total} Fragen richtig
          </p>
        </div>

        {/* Pass/fail badge */}
        <div
          className={`inline-block rounded-xl border px-5 py-2 text-sm font-bold ${
            passed
              ? "border-pcap-green bg-pcap-green-dim text-pcap-green"
              : "border-pcap-red bg-pcap-red-dim text-pcap-red"
          }`}
        >
          {passed ? "Bestanden ✅" : "Nicht bestanden ❌"}
        </div>

        <p className="text-xs text-pcap-muted">Bestehensgrenze: 70 %</p>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/quiz/exam"
            className="rounded-lg bg-pcap-blue px-6 py-3 text-sm font-bold text-pcap-bg transition-opacity hover:opacity-80"
          >
            Nochmal versuchen →
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-pcap-border px-6 py-3 text-sm font-medium text-pcap-muted transition-colors hover:bg-pcap-border/30"
          >
            Zurück zur Startseite
          </Link>
        </div>

      </div>
    </div>
  );
}
