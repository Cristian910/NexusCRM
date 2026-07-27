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
          "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] ring-[hsl(var(--success)/0.25)]",
        warning:
          "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] ring-[hsl(var(--warning)/0.25)]",
        purple:
          "bg-[hsl(var(--stage-contacted)/0.1)] text-[hsl(var(--stage-contacted))] ring-[hsl(var(--stage-contacted)/0.25)]",
        // CRM-specific
        active:
          "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] ring-[hsl(var(--success)/0.25)]",
        inactive:
          "bg-muted text-muted-foreground ring-border",
        lead:
          "bg-[hsl(var(--stage-lead)/0.1)] text-[hsl(var(--stage-lead))] ring-[hsl(var(--stage-lead)/0.25)]",
        won:
          "bg-[hsl(var(--stage-won)/0.1)] text-[hsl(var(--stage-won))] ring-[hsl(var(--stage-won)/0.25)]",
        lost:
          "bg-[hsl(var(--stage-lost)/0.1)] text-[hsl(var(--stage-lost))] ring-[hsl(var(--stage-lost)/0.25)]",
        negotiation:
          "bg-[hsl(var(--stage-negotiation)/0.1)] text-[hsl(var(--stage-negotiation))] ring-[hsl(var(--stage-negotiation)/0.25)]",
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
