"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { InputProps } from "@/components/ui/input";

// Omit 'error' from InputProps (bool) and redefine as string | undefined
interface FormFieldProps extends Omit<InputProps, "error"> {
  label: string;
  error?: string;
  hint?: string;
}

export function FormField({ label, error, hint, id, className, ...props }: FormFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={fieldId}
        className={cn(error && "text-destructive")}
      >
        {label}
      </Label>
      <Input
        id={fieldId}
        error={!!error}
        className={className}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <p
          id={`${fieldId}-error`}
          role="alert"
          className="flex items-start gap-1 text-xs"
          style={{ color: "hsl(var(--destructive))" }}
        >
          <svg
            className="mt-0.5 h-3 w-3 shrink-0"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zM8 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
