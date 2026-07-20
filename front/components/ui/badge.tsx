import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary ring-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground ring-border",
        destructive:
          "bg-destructive/10 text-destructive ring-destructive/20",
        outline:
          "bg-transparent text-foreground ring-border",
        success:
          "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
        warning:
          "bg-amber-500/10 text-amber-400 ring-amber-500/20",
        purple:
          "bg-purple-500/10 text-purple-400 ring-purple-500/20",
        // CRM-specific
        active:
          "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
        inactive:
          "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
        lead:
          "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20",
        won:
          "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
        lost:
          "bg-red-500/10 text-red-400 ring-red-500/20",
        negotiation:
          "bg-amber-500/10 text-amber-400 ring-amber-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
