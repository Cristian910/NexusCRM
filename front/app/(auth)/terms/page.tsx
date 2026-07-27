import { Metadata } from "next";
import { LegalPage } from "@/features/auth/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      titleKey="legal.termsTitle"
      updatedKey="legal.termsUpdated"
      introKey="legal.termsIntro"
      sections="termsSections"
    />
  );
}
