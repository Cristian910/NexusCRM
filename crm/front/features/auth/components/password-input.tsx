"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FormField } from "./form-field";
import type { InputProps } from "@/components/ui/input";

interface PasswordInputProps extends Omit<InputProps, "type" | "endIcon" | "error"> {
  label: string;
  error?: string;
  hint?: string;
}

export function PasswordInput({ label, error, hint, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      label={label}
      type={visible ? "text" : "password"}
      error={error}
      hint={hint}
      endIcon={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
      {...props}
    />
  );
}
