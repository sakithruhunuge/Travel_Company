import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AccountingDashboard from "@/components/accounting/AccountingDashboard";

export default async function AccountingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect(`/${locale}/login`);
  }

  // Optionally check for admin role here
  // if ((session.user as any).role !== "admin" && (session.user as any).role !== "finance") {
  //   redirect(`/${locale}/unauthorized`);
  // }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-32">
      <AccountingDashboard />
    </div>
  );
}
