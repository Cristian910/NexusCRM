import { Metadata } from "next";
import { LoginForm } from "@/features/auth";
import { AuthPageChrome } from "@/features/auth/components/auth-page-chrome";
import { LoginFooter } from "@/features/auth/components/login-footer";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <AuthPageChrome
      titleKey="auth.welcomeBack"
      subtitleKey="auth.signInSubtitle"
      footer={<LoginFooter />}
    >
      <LoginForm />
    </AuthPageChrome>
  );
}
