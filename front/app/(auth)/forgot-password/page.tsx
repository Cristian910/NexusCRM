import { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth";
import { AuthPageChrome } from "@/features/auth/components/auth-page-chrome";

export const metadata: Metadata = { title: "Reset Password" };

export default function ForgotPasswordPage() {
  return (
    <AuthPageChrome
      titleKey="auth.forgotTitle"
      subtitleKey="auth.forgotSubtitle"
    >
      <ForgotPasswordForm />
    </AuthPageChrome>
  );
}
