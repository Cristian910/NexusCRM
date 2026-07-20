import { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "NexusCRM — Your pipeline, finally somewhere it belongs",
  description:
    "A multi-tenant CRM for small sales teams: clients, deals, tasks, and analytics in one place.",
};

export default function RootPage() {
  return <LandingPage />;
}
