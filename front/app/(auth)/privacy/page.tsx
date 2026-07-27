import { Metadata } from "next";
import { LegalPage } from "@/features/auth/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      titleKey="legal.privacyTitle"
      updatedKey="legal.privacyUpdated"
      introKey="legal.privacyIntro"
      sections="privacySections"
    />
  );
}
