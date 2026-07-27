import React from "react";

interface LogomarkProps {
  size?: number;
  className?: string;
  /** "solid" = dark bars on the signal-teal badge (default, matches buttons).
   *  "gradient" = the bars themselves carry the full pipeline gradient —
   *  reserved for larger, quieter contexts (auth pages) where it can breathe. */
  variant?: "solid" | "gradient";
}

/**
 * NexusCRM's mark: three ascending bars — a deal's value climbing as it
 * moves through the pipeline. It's the same idea as the stage-temperature
 * color scale (globals.css) rendered as a shape instead of a gradient, so
 * the wordmark and the product's actual data visualization share one motif.
 */
export function Logomark({ size = 28, className, variant = "solid" }: LogomarkProps) {
  const gradientId = "nexus-logomark-gradient";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      role="img"
      aria-label="NexusCRM"
    >
      <rect width="28" height="28" rx="8" fill={variant === "solid" ? "hsl(var(--primary))" : "url(#nexus-bg)"} />
      {variant === "gradient" && (
        <defs>
          <linearGradient id="nexus-bg" x1="0" y1="28" x2="28" y2="0">
            <stop offset="0%" stopColor="hsl(var(--stage-lead))" />
            <stop offset="38%" stopColor="hsl(var(--stage-contacted))" />
            <stop offset="68%" stopColor="hsl(var(--stage-negotiation))" />
            <stop offset="100%" stopColor="hsl(var(--stage-won))" />
          </linearGradient>
        </defs>
      )}
      <rect x="7" y="15" width="3.4" height="7" rx="1" fill={variant === "solid" ? "hsl(var(--primary-foreground))" : "white"} fillOpacity={variant === "solid" ? 1 : 0.55} />
      <rect x="12.3" y="10.5" width="3.4" height="11.5" rx="1" fill={variant === "solid" ? "hsl(var(--primary-foreground))" : "white"} fillOpacity={variant === "solid" ? 1 : 0.8} />
      <rect x="17.6" y="6" width="3.4" height="16" rx="1" fill={variant === "solid" ? "hsl(var(--primary-foreground))" : "white"} />
    </svg>
  );
}
