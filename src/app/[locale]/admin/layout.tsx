import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import AdminLayout from "@/components/admin/AdminLayout";

export default async function AdminRootLayout({
    children,
    params: { locale }
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect(`/${locale}/login?callbackUrl=/${locale}/admin`);
    }

    const user = session.user as { role?: string; status?: string };
    
    // Safety check for suspension
    if (user.status === "suspended") {
        redirect(`/${locale}/login?error=suspended`);
    }

    if (!isAdminRole(user.role)) {
        redirect(`/${locale}/dashboard`);
    }

    return <AdminLayout>{children}</AdminLayout>;
}
