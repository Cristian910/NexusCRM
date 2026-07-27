import { Metadata } from "next";
import { RegisterForm } from "@/features/auth";
import { AuthPageChrome } from "@/features/auth/components/auth-page-chrome";
import { RegisterFooter } from "@/features/auth/components/register-footer";
import { RegisterLegalNotice } from "@/features/auth/components/register-legal-notice";

export const metadata: Metadata = { title: "Create Workspace" };

export default function RegisterPage() {
  return (
    <AuthPageChrome
      titleKey="auth.createWorkspace"
      subtitleKey="auth.createWorkspaceSubtitle"
      footer={
        <>
          <RegisterFooter />
          <RegisterLegalNotice />
        </>
      }
    >
      <RegisterForm />
    </AuthPageChrome>
  );
}
