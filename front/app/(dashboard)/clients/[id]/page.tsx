import { Metadata } from "next";
import { ClientDetailClient } from "./client-detail-client";

export const metadata: Metadata = { title: "Client" };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientDetailClient id={id} />;
}
