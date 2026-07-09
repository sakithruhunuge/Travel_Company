import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default async function DashboardRootLayout({ children, params: { locale } }: { children: React.ReactNode, params: { locale: string } }) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect(`/${locale}/login`);
    }

    const user = session.user as { role?: string };
    if (user.role === "super_admin" || user.role === "admin" || user.role === "staff") {
        redirect(`/${locale}/admin`);
    }

    return <DashboardLayout>{children}</DashboardLayout>;
}
