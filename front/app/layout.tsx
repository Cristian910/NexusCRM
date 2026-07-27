import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NexusCRM — Modern CRM for small sales teams",
    template: "%s · NexusCRM",
  },
  description: "Clients, deals, tasks, and analytics in one place. A full-stack CRM built with Next.js and NestJS.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
