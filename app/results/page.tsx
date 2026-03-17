import Link from "next/link";

const MODE_LABELS: Record<string, string> = {
  exam:          "Prüfungsmodus",
  learn:         "Lernmodus",
  "wrong-stack": "Falsch-Stapel",
  flagged:       "Unsicher-Stapel",
};

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ score?: string; total?: string; passed?: string; mode?: string }>;
}) {
  const { score: scoreStr, total: totalStr, passed: passedStr, mode } =
    await searchParams;

  const score  = parseInt(scoreStr ?? "0", 10);
  const total  = parseInt(totalStr ?? "0", 10);
  const passed = passedStr === "true";
  const pct    = total > 0 ? Math.round((score / total) * 100) : 0;
  const isExam = mode === "exam";
  const label  = MODE_LABELS[mode ?? ""] ?? mode ?? "Quiz";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-pcap-bg px-5 text-pcap-text">
      <div className="w-full max-w-sm space-y-6">

        {/* Result badge */}
        <div className="text-center">
          <div className="text-6xl">{isExam ? (passed ? "🎉" : "😔") : "📊"}</div>
          <h1
            className={`mt-4 text-2xl font-bold ${
              isExam
                ? passed
                  ? "text-pcap-green"
                  : "text-pcap-red"
                : "text-pcap-blue"
            }`}
          >
            {isExam ? (passed ? "Bestanden!" : "Nicht bestanden") : "Abgeschlossen"}
          </h1>
          <p className="mt-1 text-sm text-pcap-muted">{label}</p>
        </div>

        {/* Score card */}
        <div className="rounded-xl border border-pcap-border bg-pcap-surface p-6">
          <div className="text-center">
            <span className="text-5xl font-bold text-pcap-text">{score}</span>
            <span className="text-2xl text-pcap-muted"> / {total}</span>
            <div className="mt-1 text-lg font-bold text-pcap-muted">{pct} %</div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 w-full rounded-full bg-pcap-border">
            <div
              className={`h-full rounded-full ${
                isExam ? (passed ? "bg-pcap-green" : "bg-pcap-red") : "bg-pcap-blue"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {isExam && (
            <div className="mt-3 flex justify-between text-xs text-pcap-muted">
              <span>0 %</span>
              <span className="text-pcap-orange">Grenze: 70 %</span>
              <span>100 %</span>
            </div>
          )}

          <div className="mt-4 space-y-2 border-t border-pcap-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-pcap-muted">Richtig</span>
              <span className="font-bold text-pcap-green">{score}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-pcap-muted">Falsch</span>
              <span className="font-bold text-pcap-red">{total - score}</span>
            </div>
            {isExam && (
              <div className="flex justify-between">
                <span className="text-pcap-muted">Bestehensgrenze</span>
                <span className="font-bold text-pcap-orange">70 %</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/"
            className="flex-1 rounded-lg border border-pcap-border py-2.5 text-center text-sm font-bold text-pcap-text transition-colors hover:bg-pcap-border/30"
          >
            ← Startseite
          </Link>
          <Link
            href={`/quiz/${mode ?? "exam"}`}
            className="flex-1 rounded-lg bg-pcap-blue py-2.5 text-center text-sm font-bold text-pcap-bg transition-opacity hover:opacity-80"
          >
            Nochmal →
          </Link>
        </div>

      </div>
    </div>
  );
}
