"use client";

import { formatNumber } from "@/lib/utils";

// ── Recharts custom tooltip ───────────────────────────────────────
interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  valueFormatter?: (v: number, key: string) => string;
}

export function CustomTooltip({
  active, payload, label, valueFormatter,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg border px-3 py-2.5 shadow-lg text-xs min-w-[140px]"
      style={{
        background: "hsl(var(--popover))",
        borderColor: "hsl(var(--border))",
        color: "hsl(var(--popover-foreground))",
      }}
    >
      {label && (
        <p
          className="mb-2 font-medium pb-1.5 border-b"
          style={{
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        >
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: item.color }}
              />
              <span style={{ color: "hsl(var(--muted-foreground))" }}>{item.name}</span>
            </div>
            <span className="font-medium tabular-nums" style={{ color: "hsl(var(--foreground))" }}>
              {valueFormatter
                ? valueFormatter(item.value, item.dataKey)
                : formatNumber(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
