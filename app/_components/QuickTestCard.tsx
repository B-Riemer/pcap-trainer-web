"use client";

import { useState } from "react";

const QT_COUNTS = [10, 15, 20] as const;
const QT_TIMES  = [15, 20, 30] as const;

function ToggleGroup<T extends number>({
  label, values, selected, onSelect, formatLabel,
}: {
  label: string;
  values: readonly T[];
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

export function QuickTestCard() {
  const [qtN, setQtN]       = useState<(typeof QT_COUNTS)[number]>(15);
  const [qtMins, setQtMins] = useState<(typeof QT_TIMES)[number]>(20);

  return (
    <div className="rounded-xl border border-pcap-border bg-pcap-surface p-5">
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
    </div>
  );
}
