"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNavbar from "@/components/dashboard/TopNavbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        if (status !== "authenticated") return;
        if (!session?.user) {
            router.replace("/login");
        }
    }, [router, session, status]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
                    <p className="mt-4 text-sm font-medium text-slate-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!session?.user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.06),_transparent_35%),linear-gradient(135deg,_#FAF8F5_0%,_#F3EFE9_100%)] p-3 md:p-6">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row">
                <div className="lg:hidden">
                    <button
                        onClick={() => setMobileSidebarOpen((prev) => !prev)}
                        className="mb-2 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white active:scale-95"
                    >
                        {mobileSidebarOpen ? "✕ Close Menu" : "☰ Open Menu"}
                    </button>
                    {mobileSidebarOpen ? (
                        <div className="mb-3 animate-scale-in">
                            <Sidebar onNavigate={() => setMobileSidebarOpen(false)} onLogout={() => signOut({ callbackUrl: "/login" })} />
                        </div>
                    ) : null}
                </div>

                <div className="hidden lg:block lg:w-72">
                    <Sidebar onNavigate={() => undefined} onLogout={() => signOut({ callbackUrl: "/login" })} />
                </div>

                <div className="flex-1 space-y-4">
                    <TopNavbar title="Dashboard" subtitle="Manage your Sri Lanka plans" />
                    <main className="animate-scale-in">{children}</main>
                </div>
            </div>
        </div>
    );
}
