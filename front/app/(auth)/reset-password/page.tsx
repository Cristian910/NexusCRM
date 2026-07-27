"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/features/auth";
import { AuthPageChrome } from "@/features/auth/components/auth-page-chrome";

function ResetPasswordCard() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage() {
  return (
    <AuthPageChrome
      titleKey="auth.resetTitle"
      subtitleKey="auth.resetSubtitle"
    >
      <Suspense fallback={<div className="h-40" />}>
        <ResetPasswordCard />
      </Suspense>
    </AuthPageChrome>
  );
}
